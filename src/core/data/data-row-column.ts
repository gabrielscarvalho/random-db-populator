import { iColumn, iDataRowColumn, iDataRow, iValueGenerator } from '../../interfaces';
import { DataRow } from './data-row';


export class DataRowColumn implements iDataRowColumn {

  public parsedValue: string;

  public constructor( public dataRow: iDataRow,  public column: iColumn, public rawValue: any){
    this.parsedValue = this.column.parser.parse(rawValue);
  }

  public getRawValueAsValueGen(): iValueGenerator {
    return () => {
      return this.rawValue;
    }
  }

}