-- Subscriptions Table für Lemon Squeezy Integration
CREATE TABLE mini_todo.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  lemonsqueezy_subscription_id TEXT UNIQUE,
  lemonsqueezy_customer_id TEXT,
  variant_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'paused', 'inactive')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für schnelle Lookups
CREATE INDEX idx_subscriptions_user_id ON mini_todo.subscriptions(user_id);
CREATE INDEX idx_subscriptions_ls_id ON mini_todo.subscriptions(lemonsqueezy_subscription_id);

-- Updated_at Trigger (nutzt existierende Funktion aus 001)
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON mini_todo.subscriptions
  FOR EACH ROW EXECUTE FUNCTION mini_todo.update_updated_at();

-- RLS aktivieren
ALTER TABLE mini_todo.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Nutzer können nur ihren eigenen Status lesen
CREATE POLICY "Users can read own subscription"
  ON mini_todo.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service Role kann alles (für Webhook Handler)
CREATE POLICY "Service role full access"
  ON mini_todo.subscriptions FOR ALL
  USING (auth.role() = 'service_role');
