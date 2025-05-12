import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as originalSchema from '../shared/schema';
import * as supabaseSchema from '../supabase/schema';

// Environment check
if (!process.env.DATABASE_URL) {
  throw new Error('SOURCE_DATABASE_URL environment variable must be set');
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
    connectionString: `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.mvmbtxwdovdubcojrwjz.supabase.co:5432/postgres` 
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
          // Map any new fields here
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
    
    // Migrate user teams
    console.log('Migrating user teams...');
    const userTeams = await sourceDb.query.userTeams.findMany();
    console.log(`Found ${userTeams.length} user teams to migrate`);
    
    for (const userTeam of userTeams) {
      try {
        await targetDb.insert(supabaseSchema.userTeams).values(userTeam).onConflictDoUpdate({
          target: supabaseSchema.userTeams.id,
          set: userTeam
        });
        console.log(`Migrated user team: ${userTeam.id}`);
      } catch (error) {
        console.error(`Failed to migrate user team ${userTeam.id}:`, error);
      }
    }
    
    // Migrate contacts
    console.log('Migrating contacts...');
    const contacts = await sourceDb.query.contacts.findMany();
    console.log(`Found ${contacts.length} contacts to migrate`);
    
    for (const contact of contacts) {
      try {
        await targetDb.insert(supabaseSchema.contacts).values({
          ...contact,
          // Map any new fields here
          googleContactId: null
        }).onConflictDoUpdate({
          target: supabaseSchema.contacts.id,
          set: {
            ...contact,
            googleContactId: null
          }
        });
        console.log(`Migrated contact: ${contact.name}`);
      } catch (error) {
        console.error(`Failed to migrate contact ${contact.name}:`, error);
      }
    }
    
    // Migrate pipeline stages
    console.log('Migrating pipeline stages...');
    const pipelineStages = await sourceDb.query.pipelineStages.findMany();
    console.log(`Found ${pipelineStages.length} pipeline stages to migrate`);
    
    for (const stage of pipelineStages) {
      try {
        await targetDb.insert(supabaseSchema.pipelineStages).values(stage).onConflictDoUpdate({
          target: supabaseSchema.pipelineStages.id,
          set: stage
        });
        console.log(`Migrated pipeline stage: ${stage.name}`);
      } catch (error) {
        console.error(`Failed to migrate pipeline stage ${stage.name}:`, error);
      }
    }
    
    // Migrate deals
    console.log('Migrating deals...');
    const deals = await sourceDb.query.deals.findMany();
    console.log(`Found ${deals.length} deals to migrate`);
    
    for (const deal of deals) {
      try {
        await targetDb.insert(supabaseSchema.deals).values(deal).onConflictDoUpdate({
          target: supabaseSchema.deals.id,
          set: deal
        });
        console.log(`Migrated deal: ${deal.name}`);
      } catch (error) {
        console.error(`Failed to migrate deal ${deal.name}:`, error);
      }
    }
    
    // Migrate tasks
    console.log('Migrating tasks...');
    const tasks = await sourceDb.query.tasks.findMany();
    console.log(`Found ${tasks.length} tasks to migrate`);
    
    for (const task of tasks) {
      try {
        await targetDb.insert(supabaseSchema.tasks).values({
          ...task,
          // Map any new fields here
          googleEventId: null
        }).onConflictDoUpdate({
          target: supabaseSchema.tasks.id,
          set: {
            ...task,
            googleEventId: null
          }
        });
        console.log(`Migrated task: ${task.title}`);
      } catch (error) {
        console.error(`Failed to migrate task ${task.title}:`, error);
      }
    }
    
    // Migrate activities
    console.log('Migrating activities...');
    const activities = await sourceDb.query.activities.findMany();
    console.log(`Found ${activities.length} activities to migrate`);
    
    for (const activity of activities) {
      try {
        await targetDb.insert(supabaseSchema.activities).values({
          ...activity,
          // Map any new fields here
          gmailThreadId: null
        }).onConflictDoUpdate({
          target: supabaseSchema.activities.id,
          set: {
            ...activity,
            gmailThreadId: null
          }
        });
        console.log(`Migrated activity: ${activity.title}`);
      } catch (error) {
        console.error(`Failed to migrate activity ${activity.title}:`, error);
      }
    }
    
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