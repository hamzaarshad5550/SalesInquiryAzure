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
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const originalSchema = __importStar(require("../shared/schema"));
const supabaseSchema = __importStar(require("../supabase/schema"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
    const sourcePool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const sourceDb = (0, node_postgres_1.drizzle)(sourcePool, { schema: originalSchema });
    // Target database connection (Supabase)
    const targetPool = new pg_1.Pool({
        connectionString: `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.${process.env.SUPABASE_PROJECT_ID}.supabase.co:5432/postgres`
    });
    const targetDb = (0, node_postgres_1.drizzle)(targetPool, { schema: supabaseSchema });
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
            }
            catch (error) {
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
            }
            catch (error) {
                console.error(`Failed to migrate team ${team.name}:`, error);
            }
        }
        // Add migration for other tables...
        console.log('Migration completed successfully!');
    }
    catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
    finally {
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
