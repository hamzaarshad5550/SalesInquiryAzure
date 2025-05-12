import pg from 'pg';
const { Pool } = pg;

// Create a connection pool using environment variables
const pool = new Pool();

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // Test query to get database info
    const result = await client.query('SELECT current_database() as db_name, current_user as username');
    console.log('Connected to database:', result.rows[0].db_name);
    console.log('Connected as user:', result.rows[0].username);
    
    // Create a test table
    try {
      await client.query('CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name TEXT)');
      console.log('Successfully created or verified test_table');
      
      // Insert a test row
      await client.query('INSERT INTO test_table (name) VALUES ($1) RETURNING id', ['Test entry']);
      console.log('Successfully inserted test data');
      
      // Query the test data
      const testData = await client.query('SELECT * FROM test_table');
      console.log('Test data:', testData.rows);
    } catch (err) {
      console.error('Error with test operations:', err.message);
    }
    
    client.release();
    console.log('Database connection test completed');
  } catch (err) {
    console.error('Error connecting to database:', err.message);
    if (err.message.includes('endpoint is disabled')) {
      console.log('\nThe Neon database endpoint is disabled. You need to:');
      console.log('1. Enable the endpoint in the Neon dashboard, or');
      console.log('2. Use a different database connection');
    }
  } finally {
    await pool.end();
  }
}

testConnection();