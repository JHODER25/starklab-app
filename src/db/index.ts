import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Cache the database connection in development. This avoids creating a new connection on every HMR update.
const globalForPostgres = globalThis as unknown as {
  postgresClient: postgres.Sql | undefined
}

export const client = globalForPostgres.postgresClient ?? postgres(connectionString, { prepare: false, max: 10 })

if (process.env.NODE_ENV !== 'production') {
  globalForPostgres.postgresClient = client
}

export const db = drizzle(client, { schema });
