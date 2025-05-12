import pg from 'pg';
const { Pool } = pg;

function formatDatabaseUrl(url) {
  if (!url) return 'Not set';
  try {
    const parsedUrl = new URL(url);
    const censoredUrl = `${parsedUrl.protocol}//${parsedUrl.username ? '***' : ''}${parsedUrl.password ? ':***@' : ''}${parsedUrl.host}${parsedUrl.pathname}`;
    return censoredUrl;
  } catch (e) {
    return 'Invalid URL format';
  }
}

// Construct the Supabase connection string
const supabasePassword = process.env.SUPABASE_PASSWORD;
const supabaseConnectionString = 
  `postgresql://postgres:${supabasePassword}@db.mvmbtxwdovdubcojrwjz.supabase.co:5432/postgres?sslmode=require`;

console.log('Testing connection to Supabase database');
console.log('Connection string (censored):', formatDatabaseUrl(supabaseConnectionString));

// Create a connection pool using Supabase connection string
const pool = new Pool({
  connectionString: supabaseConnectionString,
  ssl: {
    rejectUnauthorized: false // Important for connecting to Supabase
  }
});

async function testConnection() {
  try {
    console.log('Attempting to connect to Supabase database...');
    const client = await pool.connect();
    console.log('Successfully connected to Supabase database!');
    
    // Test query to get database info
    const result = await client.query('SELECT current_database() as db_name, current_user as username');
    console.log('Connected to database:', result.rows[0].db_name);
    console.log('Connected as user:', result.rows[0].username);
    
    // List tables to check schema
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    
    console.log('Tables in the database:');
    if (tables.rows.length === 0) {
      console.log('No tables found. Database is empty.');
    } else {
      tables.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    client.release();
    console.log('Database connection test completed successfully');
  } catch (err) {
    console.error('Error connecting to Supabase database:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();