-- Multi-Day Planning Feature
-- Adds date support to todos and weekday-based settings

-- 1. Add date column to todos (required, defaults to today for migration)
ALTER TABLE mini_todo.todos ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Update existing todos to have today's date (already handled by DEFAULT, but explicit)
UPDATE mini_todo.todos SET date = CURRENT_DATE WHERE date IS NULL;

-- New index for date-based queries
CREATE INDEX idx_todos_date ON mini_todo.todos(user_id, date, sort_order);

-- 2. Weekday Defaults Table (0=Sunday, 6=Saturday - JavaScript getDay() convention)
CREATE TABLE mini_todo.weekday_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TEXT NOT NULL DEFAULT '09:00',
  available_hours NUMERIC NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, weekday)
);

CREATE INDEX idx_weekday_defaults_user_id ON mini_todo.weekday_defaults(user_id);

-- Apply updated_at trigger
CREATE TRIGGER weekday_defaults_updated_at
  BEFORE UPDATE ON mini_todo.weekday_defaults
  FOR EACH ROW EXECUTE FUNCTION mini_todo.update_updated_at();

-- Enable RLS
ALTER TABLE mini_todo.weekday_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own weekday defaults"
  ON mini_todo.weekday_defaults FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Daily Overrides Table (specific date overrides)
CREATE TABLE mini_todo.daily_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  available_hours NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_overrides_user_date ON mini_todo.daily_overrides(user_id, date);

-- Apply updated_at trigger
CREATE TRIGGER daily_overrides_updated_at
  BEFORE UPDATE ON mini_todo.daily_overrides
  FOR EACH ROW EXECUTE FUNCTION mini_todo.update_updated_at();

-- Enable RLS
ALTER TABLE mini_todo.daily_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily overrides"
  ON mini_todo.daily_overrides FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Migrate existing user_settings to weekday_defaults
-- Copy start_time and available_hours from user_settings to all 7 weekdays
INSERT INTO mini_todo.weekday_defaults (user_id, weekday, start_time, available_hours)
SELECT
  us.user_id,
  wd.weekday,
  us.start_time,
  us.available_hours
FROM mini_todo.user_settings us
CROSS JOIN generate_series(0, 6) AS wd(weekday)
ON CONFLICT (user_id, weekday) DO NOTHING;

-- 5. Grant permissions (consistent with 002_grant_schema_access.sql pattern)
GRANT ALL ON mini_todo.weekday_defaults TO authenticated;
GRANT SELECT ON mini_todo.weekday_defaults TO anon;
GRANT ALL ON mini_todo.daily_overrides TO authenticated;
GRANT SELECT ON mini_todo.daily_overrides TO anon;
