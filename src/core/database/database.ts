import { table } from 'console';
import _ from 'lodash';
import { iDatabase, iDatabaseReservedWords, iDataRow, iDataRowParsed, iParser, iTable } from '../../interfaces';
import { DataRowParsed } from '../data/data-row-parsed';
import { EntityParser } from '../parsers/entity.parser';
import QueryCommand from '../query-builder/query-command.enum';
import { NamedMap } from '../utils/named.map';
import { Optional } from '../utils/optional';
import { Table } from './table';

export abstract class Database implements iDatabase {
  public tables: NamedMap<iTable>;
  public parsers: NamedMap<iParser>;

  public dataRows: iDataRow[];
  private entityParser: iParser;

  public constructor(public reservedWords: iDatabaseReservedWords) {
    this.tables = new NamedMap<iTable>();
    this.parsers = new NamedMap<iParser>();
    this.dataRows = [];
    this.entityParser = new EntityParser(this.reservedWords);
  }

  public addParser(parser: iParser): iDatabase {
    this.parsers.add(parser.type, parser);
    return this;
  }

  public getParser(parserName: string): iParser {
    return this.parsers.getForced(parserName);
  }

  public addTable(tableName: string): iTable {
    const table = new Table(this, tableName);
    this.tables.add(tableName, table, { throwIfExists: true });
    return table;
  }

  public getTable(tableName: string): iTable {
    return this.tables.getForced(tableName);
  }

  public getLastDataRow(tableName: string): Optional<iDataRow> {
    //will assure that table exists
    this.getTable(tableName);

    let lastRow: iDataRow = null;
    this.dataRows.forEach((dataRow: iDataRow) => {
      if (dataRow.table.name === tableName) {
        lastRow = dataRow;
      }
    });

    return Optional.fromValue(lastRow);
  }

  public insert(tableName: string, extraData: object = {}, comment: string = null): iDataRow {
    const dataRow: iDataRow = this.getTable(tableName).insert(extraData, comment);
    return dataRow;
  }

  public dangerous_addDataRow(dataRow: iDataRow): iDatabase {
    this.dataRows.push(dataRow);
    return this;
  }

  public toSQL(): string[] {
    const sqls = [];
    this.dataRows.forEach((dataRow: iDataRow) => {
      if (!!dataRow.comment) {
        sqls.push(this.createComment(dataRow.comment));
      }

      sqls.push(this.createCommand(dataRow));
    });
    return sqls;
  }

  public rollback(): string[] {
    const queries: string[] = [];

    queries.push(this.createComment(' --- ROLLBACK'));

    const alreadyExecuted: iDataRow[] = (this.dataRows || []).filter((dataRow: iDataRow) => {
      return dataRow.hasCreatedQuery;
    });

    if (this.dataRows.length > 0 && alreadyExecuted.length === 0) {
      throw new Error('You should call `database.toSQL()` before calling `database.rollback()`.');
    }

    const deleteRows = _.cloneDeep(alreadyExecuted).reverse();

    (deleteRows || []).forEach((dataRow: iDataRow) => {
      dataRow.queryCommand = QueryCommand.DELETE;
      queries.push(this.createCommand(dataRow));

      if (!!dataRow.comment) {
        queries.push(this.createComment(dataRow.comment));
      }
    });

    return queries;
  }

  public printParsers(): void {
    console.log('|-- PARSERS ------------------------');

    (this.parsers.getValues() || []).forEach((value: iParser) => {
      const description: string = value.description ? value.description : `Parses to format ${value.type}`;
      const type = value.type.padEnd(30, ' ');
      console.log(`\t${type} ${description}`);
    });
  }

  protected createCommand(dataRow: iDataRow): string {
    let query: string = null;

    const dataRowParsed: iDataRowParsed = new DataRowParsed(this.entityParser, dataRow);

    if (dataRow.queryCommand === QueryCommand.INSERT) {
      query = this.createInsertQuery(dataRowParsed);
    } else if (dataRow.queryCommand === QueryCommand.DELETE) {
      this.throwIfHasNotUniqueKeys(dataRow.table);
      query = this.createDeleteQuery(dataRowParsed);
    }

    if (query === null) {
      throw new Error(`Impl not found to query command:  [${dataRow.queryCommand}].`);
    }

    dataRow.hasCreatedQuery = true;
    return query;
  }

  protected throwIfHasNotUniqueKeys(table: iTable) {
    if (table.getUniqueKeyColumns().length === 0) {
      throw new Error(
        `To create DELETE command to table: [${table.name}] it is required to table to have called: 'table.setUniqueKeys(column_name1,...)'`
      );
    }
  }

  /**
   * Creates the insert query command.
   * @return string
   */
  protected abstract createComment(comment: string): string;

  /**
   * Creates the insert query command.
   * @return string
   */
  protected abstract createInsertQuery(dataRow: iDataRowParsed): string;

  /**
   * Creates the delete query command.
   * @return string
   */
  protected abstract createDeleteQuery(dataRow: iDataRowParsed): string;
}
