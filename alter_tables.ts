import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    await sql`ALTER TABLE habits ADD COLUMN IF NOT EXISTS description TEXT;`;
    await sql`ALTER TABLE habits ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0 NOT NULL;`;
    console.log("Columns added successfully");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
