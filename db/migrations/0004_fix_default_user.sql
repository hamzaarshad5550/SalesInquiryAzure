-- Drop the existing default user if it exists
DELETE FROM users WHERE username = 'admin';

-- Insert a default user with the correct schema
INSERT INTO users (username, password, name, full_name, email, created_at, updated_at)
VALUES (
    'admin',
    'default_password',
    'Admin User',
    'Admin User',
    'admin@example.com',
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING; 