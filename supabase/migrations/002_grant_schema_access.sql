-- Grant schema usage to authenticated users
GRANT USAGE ON SCHEMA mini_todo TO authenticated;
GRANT USAGE ON SCHEMA mini_todo TO anon;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA mini_todo TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA mini_todo TO anon;

-- Grant for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA mini_todo GRANT ALL ON TABLES TO authenticated;
