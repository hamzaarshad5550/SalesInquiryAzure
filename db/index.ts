import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Construct Supabase connection string or fallback to DATABASE_URL
let connectionString: string;

try {
  if (process.env.SUPABASE_PASSWORD) {
    connectionString = `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.mvmbtxwdovdubcojrwjz.supabase.co:5432/postgres`;
    console.log("Using Supabase database connection");
  } else {
    connectionString = process.env.DATABASE_URL as string;
    console.log("Using fallback DATABASE_URL connection");
  }

  if (!connectionString) {
    throw new Error("Database connection string is missing");
  }
} catch (error) {
  console.error("Error setting up database connection:", error);
  throw new Error("Database connection configuration failed");
}

// Configure connection with robust settings
export const pool = new Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: false  // Required for cloud database connections
  },
  // Attempt to handle connectivity issues
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  max: 20 // Maximum number of clients in the pool
});

export const db = drizzle(pool, { schema });