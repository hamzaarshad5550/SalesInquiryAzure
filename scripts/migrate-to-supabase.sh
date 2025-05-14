#!/bin/bash

# Load environment variables
source .env

# Check for required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

if [ -z "$SUPABASE_PASSWORD" ]; then
  echo "Error: SUPABASE_PASSWORD environment variable is not set"
  exit 1
fi

# Run the migration script
echo "Starting migration to Supabase..."
npx tsx scripts/migrate-to-supabase.ts
