import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Construct the Supabase connection string
const supabaseConnectionString = `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.mvmbtxwdovdubcojrwjz.supabase.co:5432/postgres`;

// Override DATABASE_URL with Supabase connection string
process.env.DATABASE_URL = supabaseConnectionString;

if (!process.env.SUPABASE_PASSWORD) {
  throw new Error(
    "SUPABASE_PASSWORD must be set. Did you forget to provide the Supabase database password?",
  );
}

export const pool = new Pool({ connectionString: supabaseConnectionString });
export const db = drizzle(pool, { schema });