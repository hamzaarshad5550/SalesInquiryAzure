import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use Supabase connection string if available, otherwise fallback to DATABASE_URL
const connectionString = process.env.SUPABASE_CONNECTION_STRING || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Database connection string must be set. Did you forget to provision a database?",
  );
}

// Configure SSL for Supabase connection
export const pool = new Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false  // Required for Supabase connections
  }
});

export const db = drizzle(pool, { schema });