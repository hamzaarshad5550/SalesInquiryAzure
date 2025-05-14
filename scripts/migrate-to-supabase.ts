import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as originalSchema from '../shared/schema';
import * as supabaseSchema from '../supabase/schema';
import dotenv from 'dotenv';

dotenv.config();

// Environment check
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable must be set');
}

if (!process.env.SUPABASE_PASSWORD) {
  throw new Error('SUPABASE_PASSWORD environment variable must be set');
}

async function migrateData() {
  console.log('Starting migration to Supabase...');
  
  // Source database connection (existing database)
  const sourcePool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sourceDb = drizzle(sourcePool, { schema: originalSchema });
  
  // Target database connection (Supabase)
  const targetPool = new Pool({ 
    connectionString: `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.${process.env.SUPABASE_PROJECT_ID}.supabase.co:5432/postgres` 
  });
  const targetDb = drizzle(targetPool, { schema: supabaseSchema });
  
  try {
    // Migrate users
    console.log('Migrating users...');
    const users = await sourceDb.query.users.findMany();
    console.log(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      try {
        await targetDb.insert(supabaseSchema.users).values({
          ...user,
          authId: null // Initially null, will be updated when user authenticates with Supabase
        }).onConflictDoUpdate({
          target: supabaseSchema.users.id,
          set: {
            ...user,
            authId: null
          }
        });
        console.log(`Migrated user: ${user.username}`);
      } catch (error) {
        console.error(`Failed to migrate user ${user.username}:`, error);
      }
    }
    
    // Migrate teams
    console.log('Migrating teams...');
    const teams = await sourceDb.query.teams.findMany();
    console.log(`Found ${teams.length} teams to migrate`);
    
    for (const team of teams) {
      try {
        await targetDb.insert(supabaseSchema.teams).values(team).onConflictDoUpdate({
          target: supabaseSchema.teams.id,
          set: team
        });
        console.log(`Migrated team: ${team.name}`);
      } catch (error) {
        console.error(`Failed to migrate team ${team.name}:`, error);
      }
    }
    
    // Add migration for other tables...
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run the migration
migrateData().catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
