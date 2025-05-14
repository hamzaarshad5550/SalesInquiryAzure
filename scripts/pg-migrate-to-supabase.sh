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

# Export your database to a file
pg_dump "$DATABASE_URL" \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --no-owner \
  --no-privileges \
  > dump.sql

# Import the database to your Supabase project
SUPABASE_DB_URL="postgresql://postgres:${SUPABASE_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"
psql -d "$SUPABASE_DB_URL" -f dump.sql

echo "Migration completed!"