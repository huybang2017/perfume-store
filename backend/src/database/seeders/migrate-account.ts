import { readFileSync } from 'fs';
import { join } from 'path';
import mysql from 'mysql2/promise';
import 'dotenv/config';

/**
 * Creates user_addresses and refresh_tokens tables.
 * Run: npm run db:migrate-account --prefix backend
 */
async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  const sql = readFileSync(
    join(__dirname, '../migrations/0004_account_refresh.sql'),
    'utf8',
  );

  const conn = await mysql.createConnection(url);
  for (const stmt of sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    await conn.query(stmt);
  }
  await conn.end();
  console.log('Account tables migration complete.');
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
