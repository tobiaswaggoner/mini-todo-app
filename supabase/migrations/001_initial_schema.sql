-- Mini Todo Planner Schema
-- Schema: mini_todo (separate from public for multi-app Supabase instance)

CREATE SCHEMA IF NOT EXISTS mini_todo;

-- Todos Table (replaces mini-todos-backlog localStorage)
CREATE TABLE mini_todo.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 30,
  fixed_time TEXT, -- "HH:mm" format, nullable
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Settings Table (replaces view, startTime, availableHours localStorage)
CREATE TABLE mini_todo.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  view TEXT NOT NULL DEFAULT 'backlog' CHECK (view IN ('backlog', 'planner')),
  start_time TEXT NOT NULL DEFAULT '09:00',
  available_hours NUMERIC NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Category Colors Table (replaces mini-todos-categoryColors localStorage)
CREATE TABLE mini_todo.category_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  color_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Indexes
CREATE INDEX idx_todos_user_id ON mini_todo.todos(user_id);
CREATE INDEX idx_todos_sort_order ON mini_todo.todos(user_id, sort_order);
CREATE INDEX idx_category_colors_user_id ON mini_todo.category_colors(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION mini_todo.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON mini_todo.todos
  FOR EACH ROW EXECUTE FUNCTION mini_todo.update_updated_at();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON mini_todo.user_settings
  FOR EACH ROW EXECUTE FUNCTION mini_todo.update_updated_at();

-- Enable Row Level Security
ALTER TABLE mini_todo.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_todo.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_todo.category_colors ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can manage own todos"
  ON mini_todo.todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings"
  ON mini_todo.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own category colors"
  ON mini_todo.category_colors FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
