const { Pool } = require('pg');

// Construct the Supabase connection string
const supabaseConnectionString = `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.mvmbtxwdovdubcojrwjz.supabase.co:5432/postgres`;

console.log('Connecting to Supabase database...');
console.log('Connection string (without password):', supabaseConnectionString.replace(process.env.SUPABASE_PASSWORD, '[REDACTED]'));

const pool = new Pool({ connectionString: supabaseConnectionString });

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // Test query
    const result = await client.query('SELECT NOW() as time');
    console.log('Database time:', result.rows[0].time);
    
    client.release();
    console.log('Connection test completed successfully!');
  } catch (err) {
    console.error('Error connecting to the database:', err);
  } finally {
    pool.end();
  }
}

testConnection();