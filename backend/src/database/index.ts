import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

export type DrizzleDB = MySql2Database<typeof schema>;

export function createDrizzleClient(databaseUrl: string): DrizzleDB {
  const pool = mysql.createPool(databaseUrl);
  return drizzle(pool, { schema, mode: 'default' });
}
