import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS password_hash;`;
    console.log("Column dropped successfully");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
