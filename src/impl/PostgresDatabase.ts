import { Database } from '../core/database/database';
import { BooleanParser } from '../core/parsers/boolean.parser';
import { DateParser } from '../core/parsers/date.parser';
import { DateTimeParser } from '../core/parsers/datetime.parser';
import { IntParser } from '../core/parsers/int.parser';
import { NumberParser } from '../core/parsers/number.parser';
import { RawParser } from '../core/parsers/raw.parser';
import { StringParser } from '../core/parsers/string.parser';
import QueryCommand from '../core/query-builder/query-command.enum';
import { iDatabase, iDataRow } from '../interfaces';

export class PostgresDatabase extends Database implements iDatabase {

  public constructor() {
    super();
    this.addParser(new StringParser(this.reservedWords));
    this.addParser(new NumberParser(this.reservedWords));
    this.addParser(new IntParser(this.reservedWords));
    this.addParser(new DateParser(this.reservedWords));
    this.addParser(new DateTimeParser(this.reservedWords));
    this.addParser(new RawParser(this.reservedWords));
    this.addParser(new BooleanParser(this.reservedWords));
  }


   
  public toSQL(): string[] {
    const sqls = [];
    this.dataRows.forEach((dataRow: iDataRow) => {
      sqls.push(this.createCommand(dataRow));
    });
    return sqls;
  }

  protected createCommand(dataRow: iDataRow): string {
    if(dataRow.queryCommand === QueryCommand.INSERT) {
      return this.createInsert(dataRow);
    }
    throw new Error(`Impl not found to query command:  [${dataRow.queryCommand}].`);
  }

  protected createInsert(dataRow: iDataRow): string {
    const columns: string = dataRow.getColumnsName().join(', ');
    const values: string  = dataRow.getColumnsParsedValue().join(', ');
    const table = dataRow.table.name;
    return `INSERT INTO ${table} (${columns}) VALUES (${values});`;
  }

}