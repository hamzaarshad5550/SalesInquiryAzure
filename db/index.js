"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
var pg_1 = require("pg");
var node_postgres_1 = require("drizzle-orm/node-postgres"); // Use the node-postgres adapter
var schema = require("@shared/schema");
// Construct Supabase connection string or fallback to DATABASE_URL
var connectionString;
try {
    if (process.env.SUPABASE_PASSWORD) {
        connectionString = "postgresql://postgres:".concat(process.env.SUPABASE_PASSWORD, "@db.mvmbtxwdovdubcojrwjz.supabase.co:5432/postgres");
        console.log("Using Supabase database connection");
    }
    else {
        connectionString = process.env.DATABASE_URL;
        console.log("Using fallback DATABASE_URL connection");
    }
    if (!connectionString) {
        throw new Error("Database connection string is missing");
    }
}
catch (error) {
    console.error("Error setting up database connection:", error);
    throw new Error("Database connection configuration failed");
}
// Configure connection with robust settings
exports.pool = new pg_1.Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Required for cloud database connections
    },
    // Attempt to handle connectivity issues
    connectionTimeoutMillis: 10000, // 10 seconds
    idleTimeoutMillis: 30000, // 30 seconds
    max: 20 // Maximum number of clients in the pool
});
exports.db = (0, node_postgres_1.drizzle)(exports.pool, { schema: schema });
