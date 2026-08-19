import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    await sql`ALTER TABLE habits ADD COLUMN is_quantitative BOOLEAN DEFAULT false;`;
    console.log("Migration applied successfully!");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
