import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type DrizzleDB = NodePgDatabase<typeof schema>;

export function createDrizzleClient(databaseUrl: string): DrizzleDB {
  const pool = new Pool({ connectionString: databaseUrl });
  return drizzle(pool, { schema });
}
