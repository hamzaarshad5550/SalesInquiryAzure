import { Pool } from 'pg';

// Check environment variables
console.log('Checking database environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('PGUSER:', process.env.PGUSER ? 'Set' : 'Not set');
console.log('PGPASSWORD:', process.env.PGPASSWORD ? 'Set (value hidden)' : 'Not set');
console.log('PGHOST:', process.env.PGHOST ? 'Set' : 'Not set');
console.log('PGPORT:', process.env.PGPORT ? 'Set' : 'Not set');
console.log('PGDATABASE:', process.env.PGDATABASE ? 'Set' : 'Not set');

// Create connection with individual parameters
const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE
});

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // Test query
    const result = await client.query('SELECT current_database() as db_name, current_user as username');
    console.log('Database info:', result.rows[0]);
    
    client.release();
    console.log('Connection test completed successfully!');
  } catch (err) {
    console.error('Error connecting to the database:', err);
  } finally {
    pool.end();
  }
}

testConnection();