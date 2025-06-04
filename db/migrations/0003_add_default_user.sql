-- Insert a default user if no users exist
INSERT INTO users (username, password, name, full_name, email, created_at, updated_at)
SELECT 'admin', 'default_password', 'Admin User', 'Admin User', 'admin@example.com', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1); 