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
const index_1 = require("./index");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function runMigrations() {
    const client = await index_1.pool.connect();
    try {
        // Create migrations table if it doesn't exist
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // Get list of executed migrations
        const { rows: executedMigrations } = await client.query('SELECT name FROM migrations');
        const executedMigrationNames = new Set(executedMigrations.map((m) => m.name));
        // Read migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();
        // Execute pending migrations
        for (const file of migrationFiles) {
            if (!executedMigrationNames.has(file)) {
                console.log(`Executing migration: ${file}`);
                const migrationPath = path.join(migrationsDir, file);
                const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
                // Start transaction
                await client.query('BEGIN');
                try {
                    // Execute migration
                    await client.query(migrationSQL);
                    // Record migration
                    await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                    // Commit transaction
                    await client.query('COMMIT');
                    console.log(`✅ Migration ${file} completed successfully`);
                }
                catch (error) {
                    // Rollback transaction on error
                    await client.query('ROLLBACK');
                    console.error(`❌ Migration ${file} failed:`, error);
                    throw error;
                }
            }
            else {
                console.log(`Skipping already executed migration: ${file}`);
            }
        }
        console.log('All migrations completed successfully!');
    }
    catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// Run migrations
runMigrations()
    .then(() => {
    console.log('Migration process completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
});
