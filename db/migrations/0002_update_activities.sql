-- Drop the existing activities table
DROP TABLE IF EXISTS activities;

-- Create the activities table with the correct structure
CREATE TABLE IF NOT EXISTS activities (
  id serial PRIMARY KEY NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  user_id integer NOT NULL REFERENCES users(id),
  related_to_type text,
  related_to_id integer,
  metadata jsonb,
  created_at timestamp DEFAULT now() NOT NULL,
  campaign_id integer REFERENCES campaigns(id)
); 