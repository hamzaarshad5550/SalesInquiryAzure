"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutations = exports.queries = exports.db = void 0;
exports.withSupabaseDb = withSupabaseDb;
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const schema = __importStar(require("./schema"));
// Initialize connection
const connectionString = process.env.SUPABASE_POSTGRES_URL ||
    `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.${process.env.SUPABASE_PROJECT_ID}.supabase.co:5432/postgres`;
if (!process.env.SUPABASE_PASSWORD && !process.env.SUPABASE_POSTGRES_URL) {
    throw new Error("Missing Supabase database connection information");
}
// For use with migrations and SQL queries
const client = (0, postgres_1.default)(connectionString);
exports.db = (0, postgres_js_1.drizzle)(client, { schema });
// Function to get database connection from Supabase
async function withSupabaseDb() {
    // Example of using Supabase for more complex operations
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        throw new Error(`Supabase error: ${error.message}`);
    }
    return data;
}
// Query builders for commonly used operations
exports.queries = {
    // Users
    async getUserById(id) {
        return await exports.db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, id)
        });
    },
    async getUserByEmail(email) {
        return await exports.db.query.users.findFirst({
            where: (users, { eq }) => eq(users.email, email)
        });
    },
    // Teams
    async getTeams() {
        return await exports.db.query.teams.findMany();
    },
    async getTeamById(id) {
        return await exports.db.query.teams.findFirst({
            where: (teams, { eq }) => eq(teams.id, id)
        });
    },
    // Contacts
    async getContacts(options = {}) {
        const { limit = 10, offset = 0, search = '' } = options;
        return await exports.db.query.contacts.findMany({
            limit,
            offset,
            where: search ? (contacts, { ilike, or }) => or(ilike(contacts.name, `%${search}%`), ilike(contacts.email, `%${search}%`), ilike(contacts.company, `%${search}%`)) : undefined
        });
    },
    // Deals
    async getDeals(options = {}) {
        const { limit = 10, offset = 0, stageId, ownerId } = options;
        return await exports.db.query.deals.findMany({
            limit,
            offset,
            where: (deals, { eq, and }) => {
                const conditions = [];
                if (stageId !== undefined)
                    conditions.push(eq(deals.stageId, stageId));
                if (ownerId !== undefined)
                    conditions.push(eq(deals.ownerId, ownerId));
                return conditions.length ? and(...conditions) : undefined;
            }
        });
    },
    // Pipeline Stages
    async getPipelineStages() {
        return await exports.db.query.pipelineStages.findMany({
            orderBy: (pipelineStages, { asc }) => [asc(pipelineStages.order)]
        });
    },
    // Tasks
    async getTasks(options = {}) {
        const { limit = 10, offset = 0, assignedTo, completed } = options;
        return await exports.db.query.tasks.findMany({
            limit,
            offset,
            where: (tasks, { eq, and }) => {
                const conditions = [];
                if (assignedTo !== undefined)
                    conditions.push(eq(tasks.assignedTo, assignedTo));
                if (completed !== undefined)
                    conditions.push(eq(tasks.completed, completed));
                return conditions.length ? and(...conditions) : undefined;
            }
        });
    },
    // Activities
    async getActivities(options = {}) {
        const { limit = 10, offset = 0, userId } = options;
        return await exports.db.query.activities.findMany({
            limit,
            offset,
            where: userId ? (activities, { eq }) => eq(activities.userId, userId) : undefined,
            orderBy: (activities, { desc }) => [desc(activities.createdAt)]
        });
    }
};
// Mutation builders for commonly used operations
exports.mutations = {
    // Users
    async createUser(data) {
        return await exports.db.insert(schema.users).values(data).returning();
    },
    async updateUser(id, data) {
        return await exports.db.update(schema.users).set(data).where(({ id: userId }) => userId === id).returning();
    },
    // Teams
    async createTeam(data) {
        return await exports.db.insert(schema.teams).values(data).returning();
    },
    async updateTeam(id, data) {
        return await exports.db.update(schema.teams).set(data).where(({ id: teamId }) => teamId === id).returning();
    },
    // Contacts
    async createContact(data) {
        return await exports.db.insert(schema.contacts).values(data).returning();
    },
    async updateContact(id, data) {
        return await exports.db.update(schema.contacts).set(data).where(({ id: contactId }) => contactId === id).returning();
    },
    // Deals
    async createDeal(data) {
        return await exports.db.insert(schema.deals).values(data).returning();
    },
    async updateDeal(id, data) {
        return await exports.db.update(schema.deals).set(data).where(({ id: dealId }) => dealId === id).returning();
    },
    async updateDealStage(id, stageId) {
        return await exports.db.update(schema.deals)
            .set({ stageId, updatedAt: new Date() })
            .where(({ id: dealId }) => dealId === id)
            .returning();
    },
    // Tasks
    async createTask(data) {
        return await exports.db.insert(schema.tasks).values(data).returning();
    },
    async updateTask(id, data) {
        return await exports.db.update(schema.tasks).set(data).where(({ id: taskId }) => taskId === id).returning();
    },
    async toggleTaskCompletion(id, completed) {
        return await exports.db.update(schema.tasks)
            .set({ completed, updatedAt: new Date() })
            .where(({ id: taskId }) => taskId === id)
            .returning();
    },
    // Activities
    async createActivity(data) {
        return await exports.db.insert(schema.activities).values(data).returning();
    }
};
