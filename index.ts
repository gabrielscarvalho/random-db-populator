import { Random } from './src/core/value-generator/random';
import { AutoIncrement } from './src/core/value-generator/auto-increment';
import { LastValue } from './src/core/value-generator/last-value';
import { DateGen } from './src/core/value-generator/date';
import { Fixed } from './src/core/value-generator/fixed';
import { PostgresDatabase } from './src/impl/PostgresDatabase';
import { iDataRow } from './src/interfaces';

const database: PostgresDatabase = new PostgresDatabase();

const autoIncrement = new AutoIncrement();

autoIncrement
  .initialId('user.id', 1)
  .initialId('address.id', 2)
  .initialId('order.id', 200);


const tUser = database.addTable('user')
  .addColumn('id', 'int', autoIncrement.valueGen('user.id'))
  .addColumn('name', 'string', Random.Name())
  .addColumn('lastname', 'string', Random.LastName())
  .addColumn('email', 'string', Random.Email())
  .addColumn('bought_times', 'int', Random.Number(18, 30))
  .addColumn('gender','string', Random.PickOne(['M', 'F']))
  .addColumn('is_active','boolean', Random.Boolean())
  .addColumn('birth', 'date', DateGen.between({ year: { min: 2000, max: 2005 }}))
  .addColumn('updated_at', 'datetime', DateGen.between({ year: { min: 2019, max: 2020 }}))
  .addColumn('telephone', 'string', Fixed('55 098915651'))
  .setUniqueKeys('id', 'email');


const tAddress = database.addTable('address')
  .addColumn('id', 'int', autoIncrement.valueGen('address.id'))
  .addColumn('user_id', 'int', LastValue(tUser.getColumn('id')))
  .addColumn('receiver', 'string', Random.Name())
  .setUniqueKeys('id');;


const tOrder = database.addTable('order')
  .addColumn('id', 'int', autoIncrement.valueGen('order.id'))
  .addColumn('user_id', 'int', LastValue(tUser.getColumn('id')))
  .addColumn('user_email', 'string', LastValue(tUser.getColumn('email')))
  .addColumn('delivery_address_id', 'int', LastValue(tAddress.getColumn('id')))
  .addColumn('total_price', 'number', Random.Number(100, 900))
  .addColumn('freight_price', 'number', Random.Number(10, 50))
  .addColumn('item_price', 'number', Random.Number(90, 160))
  .addColumn('discount_price', 'number', Random.Number(10, 30))
  .setUniqueKeys('id')
  .afterGenerateData((dataRow: iDataRow) => {

    const freight = dataRow.getRawValue('freight_price');
    const items = dataRow.getRawValue('item_price');
    const discount = dataRow.getRawValue('discount_price');

    dataRow.setRawValue('total_price', (items + freight - discount));
    
    return dataRow;
  });

const user = database.insert('user', { name: 'John'}, 'Creating first user data');

const address = database.insert('address', {});

database.insert('order', {}, '---- 1st user 3 orders');
database.insert('order', {});
database.insert('order', {});


database.insert('user', {}, 'Creating second user');
database.insert('address', {});


database.insert('user', {}, 'Creating third user');
database.insert('address', {});


database.insert('user', {}, 'Creating forth user');
database.insert('address', {});


console.log(database.toSQL().join('\n'));
console.log(database.rollback().join('\n'));

console.log('hellow'); 

