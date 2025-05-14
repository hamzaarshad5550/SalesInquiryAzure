import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Initialize connection
const connectionString = process.env.SUPABASE_POSTGRES_URL || 
  `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.${process.env.SUPABASE_PROJECT_ID}.supabase.co:5432/postgres`;

if (!process.env.SUPABASE_PASSWORD && !process.env.SUPABASE_POSTGRES_URL) {
  throw new Error("Missing Supabase database connection information");
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

// Query builders for commonly used operations
export const queries = {
  // Users
  async getUserById(id: number) {
    return await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id)
    });
  },
  
  async getUserByEmail(email: string) {
    return await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email)
    });
  },
  
  // Teams
  async getTeams() {
    return await db.query.teams.findMany();
  },
  
  async getTeamById(id: number) {
    return await db.query.teams.findFirst({
      where: (teams, { eq }) => eq(teams.id, id)
    });
  },
  
  // Contacts
  async getContacts(options: { limit?: number, offset?: number, search?: string } = {}) {
    const { limit = 10, offset = 0, search = '' } = options;
    
    return await db.query.contacts.findMany({
      limit,
      offset,
      where: search ? (contacts, { ilike, or }) => or(
        ilike(contacts.name, `%${search}%`),
        ilike(contacts.email, `%${search}%`),
        ilike(contacts.company, `%${search}%`)
      ) : undefined
    });
  },
  
  // Deals
  async getDeals(options: { limit?: number, offset?: number, stageId?: number, ownerId?: number } = {}) {
    const { limit = 10, offset = 0, stageId, ownerId } = options;
    
    return await db.query.deals.findMany({
      limit,
      offset,
      where: (deals, { eq, and }) => {
        const conditions = [];
        if (stageId !== undefined) conditions.push(eq(deals.stageId, stageId));
        if (ownerId !== undefined) conditions.push(eq(deals.ownerId, ownerId));
        return conditions.length ? and(...conditions) : undefined;
      }
    });
  },
  
  // Pipeline Stages
  async getPipelineStages() {
    return await db.query.pipelineStages.findMany({
      orderBy: (pipelineStages, { asc }) => [asc(pipelineStages.order)]
    });
  },
  
  // Tasks
  async getTasks(options: { limit?: number, offset?: number, assignedTo?: number, completed?: boolean } = {}) {
    const { limit = 10, offset = 0, assignedTo, completed } = options;
    
    return await db.query.tasks.findMany({
      limit,
      offset,
      where: (tasks, { eq, and }) => {
        const conditions = [];
        if (assignedTo !== undefined) conditions.push(eq(tasks.assignedTo, assignedTo));
        if (completed !== undefined) conditions.push(eq(tasks.completed, completed));
        return conditions.length ? and(...conditions) : undefined;
      }
    });
  },
  
  // Activities
  async getActivities(options: { limit?: number, offset?: number, userId?: number } = {}) {
    const { limit = 10, offset = 0, userId } = options;
    
    return await db.query.activities.findMany({
      limit,
      offset,
      where: userId ? (activities, { eq }) => eq(activities.userId, userId) : undefined,
      orderBy: (activities, { desc }) => [desc(activities.createdAt)]
    });
  }
};

// Mutation builders for commonly used operations
export const mutations = {
  // Users
  async createUser(data: schema.InsertUser) {
    return await db.insert(schema.users).values(data).returning();
  },
  
  async updateUser(id: number, data: Partial<schema.InsertUser>) {
    return await db.update(schema.users).set(data).where(({ id: userId }) => userId === id).returning();
  },
  
  // Teams
  async createTeam(data: schema.InsertTeam) {
    return await db.insert(schema.teams).values(data).returning();
  },
  
  async updateTeam(id: number, data: Partial<schema.InsertTeam>) {
    return await db.update(schema.teams).set(data).where(({ id: teamId }) => teamId === id).returning();
  },
  
  // Contacts
  async createContact(data: schema.InsertContact) {
    return await db.insert(schema.contacts).values(data).returning();
  },
  
  async updateContact(id: number, data: Partial<schema.InsertContact>) {
    return await db.update(schema.contacts).set(data).where(({ id: contactId }) => contactId === id).returning();
  },
  
  // Deals
  async createDeal(data: schema.InsertDeal) {
    return await db.insert(schema.deals).values(data).returning();
  },
  
  async updateDeal(id: number, data: Partial<schema.InsertDeal>) {
    return await db.update(schema.deals).set(data).where(({ id: dealId }) => dealId === id).returning();
  },
  
  async updateDealStage(id: number, stageId: number) {
    return await db.update(schema.deals)
      .set({ stageId, updatedAt: new Date() })
      .where(({ id: dealId }) => dealId === id)
      .returning();
  },
  
  // Tasks
  async createTask(data: schema.InsertTask) {
    return await db.insert(schema.tasks).values(data).returning();
  },
  
  async updateTask(id: number, data: Partial<schema.InsertTask>) {
    return await db.update(schema.tasks).set(data).where(({ id: taskId }) => taskId === id).returning();
  },
  
  async toggleTaskCompletion(id: number, completed: boolean) {
    return await db.update(schema.tasks)
      .set({ completed, updatedAt: new Date() })
      .where(({ id: taskId }) => taskId === id)
      .returning();
  },
  
  // Activities
  async createActivity(data: schema.InsertActivity) {
    return await db.insert(schema.activities).values(data).returning();
  }
};
