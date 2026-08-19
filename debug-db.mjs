import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const b = await sql`SELECT * FROM habit_logs;`;
    console.log("HABIT LOGS:", b);
    const t = await sql`SELECT * FROM financial_transactions;`;
    console.log("TRANSACTIONS:", t);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
