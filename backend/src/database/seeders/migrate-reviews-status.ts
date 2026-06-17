import { readFileSync } from 'fs';
import { join } from 'path';
import mysql from 'mysql2/promise';
import 'dotenv/config';

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  const sql = readFileSync(
    join(__dirname, '../migrations/0005_review_status.sql'),
    'utf8',
  );

  const conn = await mysql.createConnection(url);
  try {
    await conn.query(sql);
    console.log('Review status migration complete.');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Duplicate column')) {
      console.log('Column status already exists — skipped.');
    } else {
      throw e;
    }
  }
  await conn.end();
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
