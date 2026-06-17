import { readFileSync } from 'fs';
import { join } from 'path';
import mysql from 'mysql2/promise';
import 'dotenv/config';

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  const sql = readFileSync(
    join(__dirname, '../migrations/0008_product_status.sql'),
    'utf8',
  );
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  const conn = await mysql.createConnection(url);
  try {
    for (const statement of statements) {
      try {
        await conn.query(statement);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('Duplicate column')) {
          console.log('Column status already exists — skipped ALTER.');
          continue;
        }
        throw e;
      }
    }
    console.log('Product status migration complete.');
  } finally {
    await conn.end();
  }
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
