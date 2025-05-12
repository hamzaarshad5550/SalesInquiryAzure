import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

// Attempt to use the local database URL if possible
const pool = new Pool(); // This will use environment variables: PGUSER, PGHOST, PGPASSWORD, PGDATABASE, PGPORT

// Export the Drizzle instance
export const db = drizzle(pool, { schema });

// Test the connection and print the database name
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT current_database() as db_name');
    console.log('Successfully connected to database:', result.rows[0].db_name);
    client.release();
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

// Run the test
testConnection();