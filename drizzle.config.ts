import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Try to load environment variables from multiple possible locations
const envPaths = [
  resolve(__dirname, '.env'),
  resolve(__dirname, 'scripts', '.env'),
  resolve(__dirname, '..', '.env'),
];

let envLoaded = false;
for (const path of envPaths) {
  if (existsSync(path)) {
    dotenv.config({ path });
    envLoaded = true;
    console.log(`Loaded environment variables from ${path}`);
    break;
  }
}

if (!envLoaded) {
  console.warn('No .env file found in any of the expected locations:', envPaths);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Please ensure the database is provisioned and the .env file exists with DATABASE_URL.");
}

export default defineConfig({
  out: "./db/migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL,
  verbose: true,
});
