import pg from 'pg';
const { Pool } = pg;

// Print the DATABASE_URL without exposing credentials
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

console.log('DATABASE_URL:', formatDatabaseUrl(process.env.DATABASE_URL));
console.log('PGDATABASE:', process.env.PGDATABASE || 'Not set');
console.log('PGHOST:', process.env.PGHOST || 'Not set');
console.log('PGPORT:', process.env.PGPORT || 'Not set');
console.log('PGUSER:', process.env.PGUSER || 'Not set');
console.log('PGPASSWORD:', process.env.PGPASSWORD ? 'Set (hidden)' : 'Not set');

// Try to connect using the individual parameters
const localPool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
});

async function testLocalConnection() {
  try {
    console.log('Attempting to connect using individual parameters...');
    const client = await localPool.connect();
    console.log('Connected to local database!');
    const result = await client.query('SELECT current_database() as db_name');
    console.log('Database name:', result.rows[0].db_name);
    client.release();
    await localPool.end();
  } catch (err) {
    console.error('Error connecting with individual parameters:', err.message);
  }
}

// Try to connect using the DATABASE_URL
const urlPool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testUrlConnection() {
  try {
    console.log('Attempting to connect using DATABASE_URL...');
    const client = await urlPool.connect();
    console.log('Connected to database via URL!');
    const result = await client.query('SELECT current_database() as db_name');
    console.log('Database name:', result.rows[0].db_name);
    client.release();
    await urlPool.end();
  } catch (err) {
    console.error('Error connecting with DATABASE_URL:', err.message);
  }
}

// Run both tests
async function runTests() {
  await testLocalConnection();
  console.log('----------------------------');
  await testUrlConnection();
}

runTests();