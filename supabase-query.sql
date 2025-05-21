-- Query 1: Check what tables exist in the database
SELECT 
  table_name 
FROM 
  information_schema.tables 
WHERE 
  table_schema = 'public' 
ORDER BY 
  table_name;

-- Query 2: Check the deals table structure again
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'deals'
ORDER BY 
  ordinal_position;

-- Query 3: Check the values in the stage column of the deals table
SELECT DISTINCT stage FROM deals;

-- Query 4: Check a sample of deals records
SELECT * FROM deals LIMIT 5;

