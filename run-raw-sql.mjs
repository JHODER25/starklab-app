import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    await sql`ALTER TABLE "habit_logs" ADD COLUMN IF NOT EXISTS "completed_value" numeric(10, 2) DEFAULT '1' NOT NULL;`;
    await sql`ALTER TABLE "habit_logs" ADD COLUMN IF NOT EXISTS "earned_xp" integer DEFAULT 0 NOT NULL;`;
    await sql`ALTER TABLE "habits" ADD COLUMN IF NOT EXISTS "target_value" numeric(10, 2) DEFAULT '1' NOT NULL;`;
    await sql`ALTER TABLE "habits" ADD COLUMN IF NOT EXISTS "base_xp" integer DEFAULT 50 NOT NULL;`;
    console.log("Migration 0001 applied");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
