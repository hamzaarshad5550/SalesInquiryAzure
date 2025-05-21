-- Create pipeline_stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop the existing deals table if it exists
DROP TABLE IF EXISTS deals;

-- Create deals table with proper foreign key reference
CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  stage INTEGER NOT NULL,
  confidence INTEGER DEFAULT 50,
  owner_id INTEGER NOT NULL,
  contact_id INTEGER NOT NULL,
  expected_close_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_stage FOREIGN KEY (stage) REFERENCES pipeline_stages(id)
);

-- Insert default pipeline stages if they don't exist
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

