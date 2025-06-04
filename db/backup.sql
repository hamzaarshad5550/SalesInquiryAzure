-- Backup script for Sales Inquiry CRM
-- This will create INSERT statements for all your data

-- Users backup
SELECT 'INSERT INTO users (id, email, username, password_hash, first_name, last_name, role, avatar_url, is_active, team_id, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    quote_literal(email) || ', ' ||
    quote_literal(username) || ', ' ||
    quote_literal(password_hash) || ', ' ||
    quote_literal(first_name) || ', ' ||
    quote_literal(last_name) || ', ' ||
    quote_literal(role) || ', ' ||
    COALESCE(quote_literal(avatar_url), 'NULL') || ', ' ||
    is_active || ', ' ||
    COALESCE(team_id::text, 'NULL') || ', ' ||
    quote_literal(created_at) || ', ' ||
    quote_literal(updated_at) || ');'
FROM users;

-- Teams backup
SELECT 'INSERT INTO teams (id, name, color, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    quote_literal(name) || ', ' ||
    COALESCE(quote_literal(color), 'NULL') || ', ' ||
    quote_literal(created_at) || ', ' ||
    quote_literal(updated_at) || ');'
FROM teams;

-- User Teams backup
SELECT 'INSERT INTO user_teams (id, user_id, team_id, is_admin) VALUES (' ||
    id || ', ' ||
    user_id || ', ' ||
    team_id || ', ' ||
    is_admin || ');'
FROM user_teams;

-- Contacts backup
SELECT 'INSERT INTO contacts (id, name, email, phone, title, company, status, avatar_url, address, notes, assigned_to, google_contact_id, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    quote_literal(name) || ', ' ||
    quote_literal(email) || ', ' ||
    COALESCE(quote_literal(phone), 'NULL') || ', ' ||
    COALESCE(quote_literal(title), 'NULL') || ', ' ||
    COALESCE(quote_literal(company), 'NULL') || ', ' ||
    COALESCE(quote_literal(status), 'NULL') || ', ' ||
    COALESCE(quote_literal(avatar_url), 'NULL') || ', ' ||
    COALESCE(quote_literal(address), 'NULL') || ', ' ||
    COALESCE(quote_literal(notes), 'NULL') || ', ' ||
    COALESCE(assigned_to::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(google_contact_id), 'NULL') || ', ' ||
    quote_literal(created_at) || ', ' ||
    quote_literal(updated_at) || ');'
FROM contacts;

-- Pipeline Stages backup
SELECT 'INSERT INTO pipeline_stages (id, name, "order", color, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    quote_literal(name) || ', ' ||
    "order" || ', ' ||
    COALESCE(quote_literal(color), 'NULL') || ', ' ||
    quote_literal(created_at) || ', ' ||
    quote_literal(updated_at) || ');'
FROM pipeline_stages;

-- Deals backup
SELECT 'INSERT INTO deals (id, title, description, value, currency, stage, contact_id, owner_id, confidence, expected_close_date, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    quote_literal(title) || ', ' ||
    COALESCE(quote_literal(description), 'NULL') || ', ' ||
    COALESCE(value::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(currency), 'NULL') || ', ' ||
    stage || ', ' ||
    contact_id || ', ' ||
    owner_id || ', ' ||
    confidence || ', ' ||
    COALESCE(quote_literal(expected_close_date), 'NULL') || ', ' ||
    quote_literal(created_at) || ', ' ||
    quote_literal(updated_at) || ');'
FROM deals;

-- Activities backup
SELECT 'INSERT INTO activities (id, lead_id, user_id, activity_type, notes, scheduled_at, completed, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    COALESCE(lead_id::text, 'NULL') || ', ' ||
    user_id || ', ' ||
    quote_literal(activity_type) || ', ' ||
    COALESCE(quote_literal(notes), 'NULL') || ', ' ||
    COALESCE(quote_literal(scheduled_at), 'NULL') || ', ' ||
    completed || ', ' ||
    quote_literal(created_at) || ', ' ||
    quote_literal(updated_at) || ');'
FROM activities;

-- Tasks backup
SELECT 'INSERT INTO tasks (id, title, description, due_date, time, priority, assigned_to, completed, related_to_type, related_to_id, google_event_id, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    quote_literal(title) || ', ' ||
    COALESCE(quote_literal(description), 'NULL') || ', ' ||
    COALESCE(quote_literal(due_date), 'NULL') || ', ' ||
    COALESCE(quote_literal(time), 'NULL') || ', ' ||
    COALESCE(quote_literal(priority), 'NULL') || ', ' ||
    COALESCE(assigned_to::text, 'NULL') || ', ' ||
    completed || ', ' ||
    COALESCE(quote_literal(related_to_type), 'NULL') || ', ' ||
    COALESCE(related_to_id::text, 'NULL') || ', ' ||
    COALESCE(quote_literal(google_event_id), 'NULL') || ', ' ||
    quote_literal(created_at) || ', ' ||
    quote_literal(updated_at) || ');'
FROM tasks;

-- Dashboard Metrics backup
SELECT 'INSERT INTO dashboard_metrics (id, metric_name, metric_value, metric_date, context, created_at) VALUES (' ||
    id || ', ' ||
    quote_literal(metric_name) || ', ' ||
    metric_value || ', ' ||
    quote_literal(metric_date) || ', ' ||
    COALESCE(quote_literal(context), 'NULL') || ', ' ||
    quote_literal(created_at) || ');'
FROM dashboard_metrics;

-- Sales Performance backup
SELECT 'INSERT INTO sales_performance (id, user_id, period, period_date, deals_won, deals_lost, revenue, target, created_at) VALUES (' ||
    id || ', ' ||
    user_id || ', ' ||
    quote_literal(period) || ', ' ||
    quote_literal(period_date) || ', ' ||
    deals_won || ', ' ||
    deals_lost || ', ' ||
    revenue || ', ' ||
    target || ', ' ||
    quote_literal(created_at) || ');'
FROM sales_performance;

-- Leads backup
SELECT 'INSERT INTO leads (id, contact_name, email, phone, company_name, source, status, value, owner_id, created_at, updated_at) VALUES (' ||
    id || ', ' ||
    quote_literal(contact_name) || ', ' ||
    quote_literal(email) || ', ' ||
    COALESCE(quote_literal(phone), 'NULL') || ', ' ||
    COALESCE(quote_literal(company_name), 'NULL') || ', ' ||
    COALESCE(quote_literal(source), 'NULL') || ', ' ||
    quote_literal(status) || ', ' ||
    COALESCE(value::text, 'NULL') || ', ' ||
    owner_id || ', ' ||
    quote_literal(created_at) || ', ' ||
    quote_literal(updated_at) || ');'
FROM leads; 