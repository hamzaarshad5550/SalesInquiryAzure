import { execSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

if (!process.env.SUPABASE_PASSWORD) {
  console.error('Error: SUPABASE_PASSWORD environment variable is not set');
  process.exit(1);
}

console.log('Starting migration to Supabase...');

try {
  // Run the TypeScript migration script
  execSync('npx tsx scripts/migrate-to-supabase.ts', { stdio: 'inherit' });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}

