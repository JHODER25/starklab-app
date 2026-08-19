import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS transaction_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(10) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    // Fetch users
    const users = await sql`SELECT id FROM users;`;
    
    for (const u of users) {
      const expenseCats = ["🍔 Comida", "🚌 Pasajes", "📚 Materiales", "🎮 Ocio"];
      const incomeCats = ["💰 Mesada", "💼 Trabajo", "🎁 Regalo", "💸 Venta"];
      
      for (const cat of expenseCats) {
        await sql`INSERT INTO transaction_categories (user_id, name, type) VALUES (${u.id}, ${cat}, 'EXPENSE');`;
      }
      for (const cat of incomeCats) {
        await sql`INSERT INTO transaction_categories (user_id, name, type) VALUES (${u.id}, ${cat}, 'INCOME');`;
      }
    }
    
    console.log("Migration and seeding applied successfully!");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
