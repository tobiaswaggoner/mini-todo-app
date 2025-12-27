-- Add language column to user_settings
ALTER TABLE mini_todo.user_settings
ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de'
CHECK (language IN ('de', 'en'));

-- Add index for potential queries by language
CREATE INDEX IF NOT EXISTS idx_user_settings_language ON mini_todo.user_settings(language);
