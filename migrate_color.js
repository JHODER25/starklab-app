const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

async function main() {
  try {
    const connectionString = process.env.DATABASE_URL;
    const sql = postgres(connectionString);
    await sql`ALTER TABLE habits ADD COLUMN IF NOT EXISTS color VARCHAR(20) NOT NULL DEFAULT '#00f3ff'`;
    console.log("MIGRATION SUCCESS");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
main();
