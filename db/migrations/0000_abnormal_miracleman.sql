-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS "campaign_targets" CASCADE;
DROP TABLE IF EXISTS "campaign_strategies" CASCADE;
DROP TABLE IF EXISTS "campaign_materials" CASCADE;
DROP TABLE IF EXISTS "activities" CASCADE;
DROP TABLE IF EXISTS "deals" CASCADE;
DROP TABLE IF EXISTS "campaigns" CASCADE;
DROP TABLE IF EXISTS "pipeline_stages" CASCADE;
DROP TABLE IF EXISTS "contacts" CASCADE;
DROP TABLE IF EXISTS "user_teams" CASCADE;
DROP TABLE IF EXISTS "teams" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "dashboard_metrics" CASCADE;
DROP TABLE IF EXISTS "sales_performance" CASCADE;
DROP TABLE IF EXISTS "leads" CASCADE;

-- First create all tables
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"team_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"title" text,
	"company" text,
	"status" text DEFAULT 'lead' NOT NULL,
	"avatar_url" text,
	"address" text,
	"notes" text,
	"assigned_to" integer,
	"google_contact_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pipeline_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"order" integer NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"value" numeric(15, 2),
	"currency" text,
	"stage" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"confidence" integer DEFAULT 50,
	"expected_close_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"user_id" integer NOT NULL,
	"activity_type" text NOT NULL,
	"notes" text,
	"scheduled_at" timestamp,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"time" text,
	"priority" text,
	"assigned_to" integer,
	"completed" boolean DEFAULT false NOT NULL,
	"related_to_type" text,
	"related_to_id" integer,
	"google_event_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "dashboard_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" double precision NOT NULL,
	"metric_date" timestamp NOT NULL,
	"context" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sales_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"period" text NOT NULL,
	"period_date" timestamp NOT NULL,
	"deals_won" integer NOT NULL,
	"deals_lost" integer NOT NULL,
	"revenue" double precision NOT NULL,
	"target" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company_name" text,
	"source" text,
	"status" text NOT NULL,
	"value" double precision,
	"owner_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Then add foreign key constraints in a separate transaction
BEGIN;

-- User Teams constraints
ALTER TABLE "user_teams" 
    ADD CONSTRAINT "user_teams_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "user_teams" 
    ADD CONSTRAINT "user_teams_team_id_teams_id_fk" 
    FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;

-- Contacts constraints
ALTER TABLE "contacts" 
    ADD CONSTRAINT "contacts_assigned_to_users_id_fk" 
    FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Deals constraints
ALTER TABLE "deals" 
    ADD CONSTRAINT "deals_stage_pipeline_stages_id_fk" 
    FOREIGN KEY ("stage") REFERENCES "pipeline_stages"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "deals" 
    ADD CONSTRAINT "deals_contact_id_contacts_id_fk" 
    FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "deals" 
    ADD CONSTRAINT "deals_owner_id_users_id_fk" 
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Activities constraints
ALTER TABLE "activities" 
    ADD CONSTRAINT "activities_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "activities" 
    ADD CONSTRAINT "activities_lead_id_leads_id_fk" 
    FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE no action ON UPDATE no action;

-- Tasks constraints
ALTER TABLE "tasks" 
    ADD CONSTRAINT "tasks_assigned_to_users_id_fk" 
    FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Sales Performance constraints
ALTER TABLE "sales_performance" 
    ADD CONSTRAINT "sales_performance_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Leads constraints
ALTER TABLE "leads" 
    ADD CONSTRAINT "leads_owner_id_users_id_fk" 
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

COMMIT;
