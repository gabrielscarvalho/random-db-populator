import { iDatabase, iDataRow, iParser, iDatabaseReservedWords, iTable } from '../../interfaces';
import { Table } from './table';
import { NamedMap } from '../utils/map';
import { Optional } from '../utils/optional';
import QueryCommand from '../query-builder/query-command.enum';
import { DatabaseReservedWords } from './reserved-words';
import _ from 'lodash';

export abstract class Database implements iDatabase {

  public tables: NamedMap<iTable>;
  public parsers: NamedMap<iParser>;
  public reservedWords: iDatabaseReservedWords = new DatabaseReservedWords();
  public dataRows: iDataRow[];

  public constructor() {
    this.tables = new NamedMap<iTable>();
    this.parsers = new NamedMap<iParser>();
    this.dataRows = [];
  }

  public addParser(parser: iParser): iDatabase {
    this.parsers.add(parser.type, parser);
    return this;
  }

  public getParser(parserName: string): iParser {
    const optParser: Optional<iParser> = this.parsers.get(parserName, { throwIfNotExists: true });
    return optParser.get({ skipValidation: true });
  }

  public addTable(tableName: string): iTable {
    const table = new Table(this, tableName);
    this.tables.add(tableName, table, { throwIfExists: true });
    return table;
  }

  public getTable(tableName: string): iTable {
    const optTable: Optional<iTable> = this.tables.get(tableName, { throwIfNotExists: true });
    return optTable.get({ skipValidation: true });
  }

  public getLastDataRow(tableName: string): Optional<iDataRow> {

    let lastRow: iDataRow = null;
    this.dataRows.forEach((dataRow: iDataRow) => {

      if (dataRow.table.name === tableName) {
        lastRow = dataRow;
      }
    });

    return Optional.fromValue(lastRow);
  }


  public insert(tableName: string, extraData: object): iDataRow {
    const dataRow: iDataRow = this.getTable(tableName)
      .createNewDataRowAndStore(QueryCommand.INSERT, extraData);
    return dataRow;
  }


  public addDataRow(dataRow: iDataRow): iDatabase {
    this.dataRows.push(dataRow);
    return this;
  }



  public toSQL(): string[] {
    const sqls = [];
    this.dataRows.forEach((dataRow: iDataRow) => {
      sqls.push(this.createCommand(dataRow));
    });
    return sqls;
  }


  public rollback(): string[] {

    const queries: string[] = [];

    const alreadyExecuted: iDataRow[] = (this.dataRows || []).filter((dataRow: iDataRow) => {
      return dataRow.hasCreatedQuery;
    });

    const deleteRows = _.cloneDeep(alreadyExecuted).reverse();

    (deleteRows || []).forEach((dataRow: iDataRow) => {
      dataRow.queryCommand = QueryCommand.DELETE;
      queries.push(this.createCommand(dataRow));
    });

    return queries;
  }

  public printParsers(): void {
    console.log('|-- PARSERS ------------------------');

    (this.parsers.getValues() || []).forEach((value: iParser) => {
      const description: string = value.description ? value.description : `Parses to format ${value.type}`;
      const type = value.type.padEnd(30, ' ')
      console.log(`\t${type} ${description}`);
    });
  }


  protected createCommand(dataRow: iDataRow): string {
    let query: string = null;

    if (dataRow.queryCommand === QueryCommand.INSERT) {
      query = this.createInsertQuery(dataRow);

    } else if (dataRow.queryCommand === QueryCommand.DELETE) {
      query = this.createDeleteQuery(dataRow);
    }

    if (query === null) {
      throw new Error(`Impl not found to query command:  [${dataRow.queryCommand}].`);
    }

    dataRow.hasCreatedQuery = true;
    return query;
  }


  /**
   * Creates the insert query command.
   * @return string
  */
  protected abstract createInsertQuery(dataRow: iDataRow): string;


  /**
   * Creates the delete query command.
   * @return string
  */
  protected abstract createDeleteQuery(dataRow: iDataRow): string;
}