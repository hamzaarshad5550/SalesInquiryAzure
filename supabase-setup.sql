-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_teams table
CREATE TABLE IF NOT EXISTS user_teams (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    title TEXT,
    company TEXT,
    status TEXT NOT NULL DEFAULT 'lead',
    avatar_url TEXT,
    address TEXT,
    notes TEXT,
    assigned_to INTEGER,
    google_contact_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Create pipeline_stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    value NUMERIC,
    currency TEXT,
    stage INTEGER NOT NULL,
    contact_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    confidence INTEGER DEFAULT 50,
    expected_close_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_stage FOREIGN KEY (stage) REFERENCES pipeline_stages(id),
    CONSTRAINT fk_contact FOREIGN KEY (contact_id) REFERENCES contacts(id),
    CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company_name TEXT,
    source TEXT,
    status TEXT NOT NULL,
    value DOUBLE PRECISION,
    owner_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER,
    user_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    notes TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    time TEXT,
    priority TEXT,
    assigned_to INTEGER,
    completed BOOLEAN NOT NULL DEFAULT false,
    related_to_type TEXT,
    related_to_id INTEGER,
    google_event_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Create sales_performance table
CREATE TABLE IF NOT EXISTS sales_performance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    period TEXT NOT NULL,
    period_date TIMESTAMP WITH TIME ZONE NOT NULL,
    deals_won INTEGER NOT NULL,
    deals_lost INTEGER NOT NULL,
    revenue DOUBLE PRECISION NOT NULL,
    target DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create dashboard_metrics table
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id SERIAL PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_date TIMESTAMP WITH TIME ZONE NOT NULL,
    context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pipeline stages
INSERT INTO pipeline_stages (name, color, "order")
SELECT 'Lead', 'blue', 1
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE name = 'Lead');

INSERT INTO pipeline_stages (name, color, "order")
SELECT 'Qualified', 'indigo', 2
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE name = 'Qualified');

INSERT INTO pipeline_stages (name, color, "order")
SELECT 'Proposal', 'purple', 3
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE name = 'Proposal');

INSERT INTO pipeline_stages (name, color, "order")
SELECT 'Negotiation', 'amber', 4
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE name = 'Negotiation');

INSERT INTO pipeline_stages (name, color, "order")
SELECT 'Closed Won', 'green', 5
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages WHERE name = 'Closed Won');

-- Insert default admin user
INSERT INTO users (id, email, name)
VALUES (1, 'admin@example.com', 'Admin User')
ON CONFLICT (id) DO NOTHING;

