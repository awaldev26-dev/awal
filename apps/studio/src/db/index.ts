import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL manquante. Copier .env.example vers .env.local.')

const client = postgres(url, { max: 5 })

export const db = drizzle(client, { schema })
export { schema }
