# Supabase Integration Plan for CRM Application

This document outlines the plan for integrating Supabase as the PostgreSQL backend for the CRM application.

## Table of Contents
1. [Supabase Setup](#supabase-setup)
2. [Schema Migration](#schema-migration)
3. [Client Integration](#client-integration)
4. [Server Integration](#server-integration)
5. [Environment Variables](#environment-variables)
6. [Migration Script](#migration-script)

## Supabase Setup

First, ensure your Supabase project is properly configured:

1. Create a new Supabase project (or use existing one)
2. Enable Row Level Security (RLS) for proper data protection
3. Configure authentication methods (email, social providers, etc.)
4. Set up storage buckets for file uploads (avatars, attachments)
5. Configure appropriate security policies

## Schema Migration

Create the following files to handle the schema migration:

### 1. `supabase/config.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 2. `supabase/schema.ts`

```typescript
import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Add new fields for authentication if needed
  authId: text("auth_id").unique(), // For Supabase Auth integration
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  avatarUrl: true,
  authId: true,
});

// Team schema
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTeamSchema = createInsertSchema(teams);

// User Team mapping
export const userTeams = pgTable("user_teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserTeamSchema = createInsertSchema(userTeams);

// Contact schema
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  title: text("title"),
  company: text("company"),
  status: text("status").default("lead").notNull(), // lead, customer, partner, inactive
  avatarUrl: text("avatar_url"),
  address: text("address"),
  notes: text("notes"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Add integration fields for Google Contacts
  googleContactId: text("google_contact_id").unique(),
});

export const insertContactSchema = createInsertSchema(contacts);

// Pipeline stages schema
export const pipelineStages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPipelineStageSchema = createInsertSchema(pipelineStages);

// Deals schema
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  stageId: integer("stage_id").references(() => pipelineStages.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  expectedCloseDate: timestamp("expected_close_date"),
  probability: integer("probability").default(50), // 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealSchema = createInsertSchema(deals);

// Tasks schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  time: text("time"), // e.g. "9:00 AM - 10:00 AM"
  completed: boolean("completed").default(false).notNull(),
  priority: text("priority").default("medium").notNull(), // high, medium, low
  assignedTo: integer("assigned_to").references(() => users.id).notNull(),
  relatedToType: text("related_to_type"), // deal, contact
  relatedToId: integer("related_to_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Add Google Calendar integration fields
  googleEventId: text("google_event_id").unique(),
});

export const insertTaskSchema = createInsertSchema(tasks);

// Activities schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // email, call, meeting, note, update
  title: text("title").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id).notNull(),
  relatedToType: text("related_to_type"), // deal, contact
  relatedToId: integer("related_to_id"),
  metadata: jsonb("metadata"), // For storing activity-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Add email thread integration fields
  gmailThreadId: text("gmail_thread_id").unique(),
});

export const insertActivitySchema = createInsertSchema(activities);

// Define relations - Same as original schema
export const usersRelations = relations(users, ({ many }) => ({
  contacts: many(contacts, { relationName: "assignedContacts" }),
  deals: many(deals, { relationName: "ownedDeals" }),
  tasks: many(tasks, { relationName: "assignedTasks" }),
  activities: many(activities),
  teams: many(userTeams),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(userTeams),
}));

export const userTeamsRelations = relations(userTeams, ({ one }) => ({
  user: one(users, { fields: [userTeams.userId], references: [users.id] }),
  team: one(teams, { fields: [userTeams.teamId], references: [teams.id] }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  assignedUser: one(users, { fields: [contacts.assignedTo], references: [users.id], relationName: "assignedContacts" }),
  deals: many(deals),
}));

export const pipelineStagesRelations = relations(pipelineStages, ({ many }) => ({
  deals: many(deals),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  stage: one(pipelineStages, { fields: [deals.stageId], references: [pipelineStages.id] }),
  contact: one(contacts, { fields: [deals.contactId], references: [contacts.id] }),
  owner: one(users, { fields: [deals.ownerId], references: [users.id], relationName: "ownedDeals" }),
  tasks: many(tasks, { relationName: "dealTasks" }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedUser: one(users, { fields: [tasks.assignedTo], references: [users.id], relationName: "assignedTasks" }),
  deal: one(deals, {
    fields: [tasks.relatedToId],
    references: [deals.id],
    relationName: "dealTasks",
    // Only apply this relation when relatedToType is 'deal'
    filterFn: (tasks, _deals) => tasks.relatedToType.equals('deal'),
  }),
  contact: one(contacts, {
    fields: [tasks.relatedToId],
    references: [contacts.id],
    // Only apply this relation when relatedToType is 'contact'
    filterFn: (tasks, _contacts) => tasks.relatedToType.equals('contact'),
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
  deal: one(deals, {
    fields: [activities.relatedToId],
    references: [deals.id],
    // Only apply this relation when relatedToType is 'deal'
    filterFn: (activities, _deals) => activities.relatedToType.equals('deal'),
  }),
  contact: one(contacts, {
    fields: [activities.relatedToId],
    references: [contacts.id],
    // Only apply this relation when relatedToType is 'contact'
    filterFn: (activities, _contacts) => activities.relatedToType.equals('contact'),
  }),
}));

// Export types for use in application
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type UserTeam = typeof userTeams.$inferSelect;
export type InsertUserTeam = z.infer<typeof insertUserTeamSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
```

### 3. `supabase/db.ts`

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { supabase } from "./config";

// Initialize connection
const connectionString = process.env.POSTGRES_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("Missing database connection string");
}

// For use with migrations and SQL queries
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Function to get database connection from Supabase
export async function withSupabaseDb() {
  // Example of using Supabase for more complex operations
  const { data, error } = await supabase.from('users').select('*');
  
  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }
  
  return data;
}
```

## Client Integration

For the client-side integration with Supabase:

### 1. `client/src/lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication functions
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  
  if (error) throw error;
  return data;
}

// Get the currently logged-in user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) throw error;
  return user;
}

// Check if user is authenticated
export async function isAuthenticated() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) throw error;
  return !!session;
}
```

### 2. Update `client/src/context/AuthContext.tsx`

Modify the existing authentication context to use Supabase.

## Server Integration

For the server-side integration:

### 1. `server/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Server-side auth functions
export async function verifyToken(token: string) {
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error) {
    throw error;
  }
  
  return data.user;
}

// Example function to access RLS-protected tables
export async function fetchWithRLS(table: string, userId: string) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    throw error;
  }
  
  return data;
}
```

### 2. Update `server/storage.ts`

Modify the storage service to use Supabase.

## Environment Variables

Create a `.env` file with the following variables:

```
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://mvmbtxwdovdubcojrwjz.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12bWJ0eHdkb3ZkdWJjb2pyd2p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTQ1NDMsImV4cCI6MjA2MjA5MDU0M30.YXjE1qf7vDbgSzijgj-7HxxMFAXv0X6xn3PRL4WViMg

# Database connection string for direct access
POSTGRES_CONNECTION_STRING=postgresql://postgres:${SUPABASE_PASSWORD}@db.mvmbtxwdovdubcojrwjz.supabase.co:5432/postgres

# Other environment variables
...
```

## Migration Script

Create a migration script to transfer data from the current database to Supabase:

### `scripts/migrate-to-supabase.ts`

```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';
import { supabase } from '../supabase/config';

async function migrateData() {
  console.log('Starting migration to Supabase...');
  
  // Source database connection (existing database)
  const sourcePool = new Pool({ connectionString: process.env.SOURCE_DATABASE_URL });
  const sourceDb = drizzle(sourcePool, { schema });
  
  // Target database connection (Supabase)
  const targetPool = new Pool({ 
    connectionString: `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.mvmbtxwdovdubcojrwjz.supabase.co:5432/postgres` 
  });
  const targetDb = drizzle(targetPool, { schema });
  
  try {
    // Migrate users
    console.log('Migrating users...');
    const users = await sourceDb.query.users.findMany();
    for (const user of users) {
      await targetDb.insert(schema.users).values(user).onConflictDoUpdate({
        target: schema.users.id,
        set: user
      });
    }
    
    // Migrate teams
    console.log('Migrating teams...');
    const teams = await sourceDb.query.teams.findMany();
    for (const team of teams) {
      await targetDb.insert(schema.teams).values(team).onConflictDoUpdate({
        target: schema.teams.id,
        set: team
      });
    }
    
    // Migrate user teams
    console.log('Migrating user teams...');
    const userTeams = await sourceDb.query.userTeams.findMany();
    for (const userTeam of userTeams) {
      await targetDb.insert(schema.userTeams).values(userTeam).onConflictDoUpdate({
        target: schema.userTeams.id,
        set: userTeam
      });
    }
    
    // Migrate contacts
    console.log('Migrating contacts...');
    const contacts = await sourceDb.query.contacts.findMany();
    for (const contact of contacts) {
      await targetDb.insert(schema.contacts).values(contact).onConflictDoUpdate({
        target: schema.contacts.id,
        set: contact
      });
    }
    
    // Migrate pipeline stages
    console.log('Migrating pipeline stages...');
    const pipelineStages = await sourceDb.query.pipelineStages.findMany();
    for (const stage of pipelineStages) {
      await targetDb.insert(schema.pipelineStages).values(stage).onConflictDoUpdate({
        target: schema.pipelineStages.id,
        set: stage
      });
    }
    
    // Migrate deals
    console.log('Migrating deals...');
    const deals = await sourceDb.query.deals.findMany();
    for (const deal of deals) {
      await targetDb.insert(schema.deals).values(deal).onConflictDoUpdate({
        target: schema.deals.id,
        set: deal
      });
    }
    
    // Migrate tasks
    console.log('Migrating tasks...');
    const tasks = await sourceDb.query.tasks.findMany();
    for (const task of tasks) {
      await targetDb.insert(schema.tasks).values(task).onConflictDoUpdate({
        target: schema.tasks.id,
        set: task
      });
    }
    
    // Migrate activities
    console.log('Migrating activities...');
    const activities = await sourceDb.query.activities.findMany();
    for (const activity of activities) {
      await targetDb.insert(schema.activities).values(activity).onConflictDoUpdate({
        target: schema.activities.id,
        set: activity
      });
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
```

### Add migration script to `package.json`

```json
{
  "scripts": {
    "migrate-to-supabase": "tsx scripts/migrate-to-supabase.ts"
  }
}
```

## Summary

This integration plan provides a comprehensive approach to migrating your CRM application to Supabase:

1. **Schema Definition**: Maintains the current schema structure with additional fields for integration with external services
2. **Authentication**: Integrates with Supabase Auth for user management
3. **Data Migration**: Includes a script to transfer existing data to Supabase
4. **Environment Setup**: Configures necessary environment variables

To complete the migration:

1. Set up the Supabase project and enable required services
2. Create the schema in Supabase using the provided definitions
3. Configure environment variables for Supabase connection
4. Run the migration script to transfer data
5. Update client and server code to use Supabase APIs
6. Test the application thoroughly to ensure all features work as expected