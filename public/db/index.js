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
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres"); // Use the node-postgres adapter
const schema = __importStar(require("@shared/schema"));
// Construct Supabase connection string or fallback to DATABASE_URL
let connectionString;
try {
    if (process.env.SUPABASE_PASSWORD) {
        connectionString = `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.mvmbtxwdovdubcojrwjz.supabase.co:5432/postgres`;
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
    connectionString,
    ssl: {
        rejectUnauthorized: false // Required for cloud database connections
    },
    // Attempt to handle connectivity issues
    connectionTimeoutMillis: 10000, // 10 seconds
    idleTimeoutMillis: 30000, // 30 seconds
    max: 20 // Maximum number of clients in the pool
});
exports.db = (0, node_postgres_1.drizzle)(exports.pool, { schema });
