import { sql } from 'drizzle-orm';
import { createDrizzleClient } from '../index';
import 'dotenv/config';

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');

  const db = createDrizzleClient(url);

  await db.execute(
    sql.raw(
      'ALTER TABLE `conversations` MODIFY `customer_id` varchar(36) NULL',
    ),
  );

  try {
    await db.execute(
      sql.raw('ALTER TABLE `conversations` ADD `guest_id` varchar(36) NULL'),
    );
  } catch {
    console.log('guest_id column already exists — skip');
  }

  try {
    await db.execute(
      sql.raw(
        'CREATE INDEX `conversations_guest_id_idx` ON `conversations` (`guest_id`)',
      ),
    );
  } catch {
    console.log('guest_id index already exists — skip');
  }

  console.log('Chat guest migration hoàn tất.');
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
