# Lemon Squeezy Integration Tutorial für Mini-Todo-App

## Übersicht

Dieses Tutorial fügt eine einfache Zwei-Tier-Monetarisierung hinzu:
- **Free Tier**: Standard-Nutzer
- **Supporter Tier**: Zahlende Nutzer mit Badge in der Header-Leiste

**Stack**: Next.js 14 + Supabase + Lemon Squeezy (MoR)

---

## Teil 1: Lemon Squeezy Setup (Dashboard)

### 1.1 Account erstellen
1. Gehe zu https://lemonsqueezy.com und erstelle einen Account
2. Wähle "Test Mode" für die Entwicklung (oben rechts umschaltbar)

### 1.2 Store einrichten
1. Dashboard → Settings → Store
2. Store-Name eingeben (z.B. "Mini Todo Planner")
3. Währung auswählen (EUR empfohlen)

### 1.3 Produkt erstellen
1. Dashboard → Products → New Product
2. **Name**: "Supporter Subscription"
3. **Pricing**: Subscription → monatlich (z.B. 3€/Monat)
4. **Variant**: Eine Variante reicht ("Supporter Monthly")
5. Speichern und **Variant ID** notieren (z.B. `123456`)

### 1.4 API Key erstellen
1. Dashboard → Settings → API
2. "Create API Key" → Name: "mini-todo-app"
3. **API Key** sicher speichern

### 1.5 Webhook einrichten
1. Dashboard → Settings → Webhooks → New Webhook
2. **Callback URL**: `https://deine-app.vercel.app/api/webhooks/lemonsqueezy`
3. **Signing Secret**: Generiere einen sicheren String (mind. 16 Zeichen)
4. **Events auswählen**:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
5. Speichern

---

## Teil 2: Datenbank-Migration

### 2.1 Neue Migration erstellen

**Datei**: `supabase/migrations/005_subscriptions.sql`

```sql
-- Subscriptions Table für Lemon Squeezy
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

-- Updated_at Trigger
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON mini_todo.subscriptions
  FOR EACH ROW EXECUTE FUNCTION mini_todo.update_updated_at();

-- RLS aktivieren
ALTER TABLE mini_todo.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Nutzer können nur ihren eigenen Status lesen
CREATE POLICY "Users can read own subscription"
  ON mini_todo.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service Role kann alles (für Webhook)
CREATE POLICY "Service role full access"
  ON mini_todo.subscriptions FOR ALL
  USING (auth.role() = 'service_role');
```

### 2.2 Migration anwenden
```bash
npx supabase db push
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
```

---

## Teil 3: Environment Variables

### 3.1 Lokale Entwicklung (`.env.local`)
```env
# Lemon Squeezy
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_SUPPORTER_VARIANT_ID=123456
NEXT_PUBLIC_LEMONSQUEEZY_SUPPORTER_VARIANT_ID=123456
```

### 3.2 Vercel Environment Variables
Gleiche Variablen in Vercel Dashboard → Settings → Environment Variables eintragen

---

## Teil 4: Code-Implementierung

### 4.1 Webhook Handler

**Datei**: `app/api/webhooks/lemonsqueezy/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!

// Signatur verifizieren
function verifySignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(digest, 'utf8'),
    Buffer.from(signature, 'utf8')
  )
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('X-Signature') || ''

  // Signatur prüfen
  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(payload)
  const eventName = event.meta.event_name
  const data = event.data.attributes

  // User ID aus custom_data extrahieren
  const userId = event.meta.custom_data?.user_id
  if (!userId) {
    console.error('No user_id in webhook custom_data')
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Status mapping
  const statusMap: Record<string, string> = {
    'active': 'active',
    'on_trial': 'active',
    'past_due': 'past_due',
    'paused': 'paused',
    'cancelled': 'cancelled',
    'expired': 'expired',
    'unpaid': 'expired',
  }

  const subscriptionData = {
    user_id: userId,
    lemonsqueezy_subscription_id: String(event.data.id),
    lemonsqueezy_customer_id: String(data.customer_id),
    variant_id: String(data.variant_id),
    status: statusMap[data.status] || 'inactive',
    current_period_end: data.renews_at || data.ends_at,
  }

  // Upsert subscription
  const { error } = await supabase
    .schema('mini_todo')
    .from('subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

### 4.2 Supporter Status Hook

**Datei**: `hooks/use-supporter-status.ts`

```typescript
"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'

export function useSupporterStatus() {
  const [isSupporter, setIsSupporter] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setIsSupporter(false)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .schema('mini_todo')
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single()

    setIsSupporter(data?.status === 'active')
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  return { isSupporter, loading, refetch: fetchStatus }
}
```

### 4.3 Checkout Link Generator

**Datei**: `lib/lemonsqueezy.ts`

```typescript
export function getCheckoutUrl(userId: string): string {
  const variantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_SUPPORTER_VARIANT_ID

  // Lemon Squeezy Checkout URL mit custom data
  const checkoutUrl = new URL(`https://mini-todo.lemonsqueezy.com/checkout/buy/${variantId}`)

  // User ID als custom data für Webhook übergeben
  checkoutUrl.searchParams.set('checkout[custom][user_id]', userId)

  // Optional: Success redirect
  checkoutUrl.searchParams.set('checkout[success_url]',
    `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}?upgraded=true`)

  return checkoutUrl.toString()
}
```

### 4.4 Supporter Badge Komponente

**Datei**: `components/supporter-badge.tsx`

```typescript
"use client"

import { Heart } from 'lucide-react'
import { useSupporterStatus } from '@/hooks/use-supporter-status'

export function SupporterBadge() {
  const { isSupporter, loading } = useSupporterStatus()

  if (loading || !isSupporter) return null

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                 bg-gradient-to-r from-pink-500 to-rose-500
                 text-white text-xs font-medium"
      title="Supporter"
    >
      <Heart className="h-3 w-3 fill-current" />
      Supporter
    </span>
  )
}
```

### 4.5 Upgrade Button Komponente

**Datei**: `components/upgrade-button.tsx`

```typescript
"use client"

import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { useSupporterStatus } from '@/hooks/use-supporter-status'
import { getCheckoutUrl } from '@/lib/lemonsqueezy'

export function UpgradeButton() {
  const { user } = useAuth()
  const { isSupporter, loading } = useSupporterStatus()

  if (loading || isSupporter || !user) return null

  const handleUpgrade = () => {
    window.open(getCheckoutUrl(user.id), '_blank')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUpgrade}
      className="gap-1"
    >
      <Sparkles className="h-4 w-4" />
      Upgrade
    </Button>
  )
}
```

---

## Teil 5: UI Integration

### 5.1 Header-Leiste anpassen

**Datei**: `app/todo-app-client.tsx` (oder wo der Header gerendert wird)

Import hinzufügen:
```typescript
import { SupporterBadge } from '@/components/supporter-badge'
import { UpgradeButton } from '@/components/upgrade-button'
```

Im Header-Bereich einfügen (neben UserMenu):
```tsx
<div className="flex items-center gap-2">
  <SupporterBadge />
  <UpgradeButton />
  <UserMenu />
  <ThemeToggle />
</div>
```

---

## Teil 6: Feature Toggles Pattern

### 6.1 Beispiel: Feature nur für Supporter

```typescript
// In beliebiger Komponente
import { useSupporterStatus } from '@/hooks/use-supporter-status'

function MyFeature() {
  const { isSupporter } = useSupporterStatus()

  if (!isSupporter) {
    return <UpgradePrompt feature="Diese Funktion" />
  }

  return <ActualFeature />
}
```

### 6.2 Upgrade Prompt Komponente

**Datei**: `components/upgrade-prompt.tsx`

```typescript
"use client"

import { Lock } from 'lucide-react'
import { UpgradeButton } from './upgrade-button'

interface UpgradePromptProps {
  feature: string
}

export function UpgradePrompt({ feature }: UpgradePromptProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8
                    border border-dashed rounded-lg bg-muted/50">
      <Lock className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-4">
        {feature} ist nur für Supporter verfügbar
      </p>
      <UpgradeButton />
    </div>
  )
}
```

---

## Teil 7: Testing

### 7.1 Test Mode in Lemon Squeezy
- Lemon Squeezy bietet Test-Kreditkarten (4242 4242 4242 4242)
- Test Mode Webhooks funktionieren identisch zu Production

### 7.2 Lokales Webhook-Testing
Für lokale Entwicklung benötigst du einen Tunnel:
```bash
# Option 1: ngrok
ngrok http 3000

# Option 2: Vercel CLI
vercel dev --listen 3000
```

Dann die ngrok-URL als Webhook-URL in Lemon Squeezy eintragen (Test Mode).

---

## Zusammenfassung der zu erstellenden/ändernden Dateien

### Neue Dateien
1. `supabase/migrations/005_subscriptions.sql` - Datenbank-Schema
2. `app/api/webhooks/lemonsqueezy/route.ts` - Webhook Handler
3. `hooks/use-supporter-status.ts` - Status Hook
4. `lib/lemonsqueezy.ts` - Checkout URL Helper
5. `components/supporter-badge.tsx` - Badge Komponente
6. `components/upgrade-button.tsx` - Upgrade Button
7. `components/upgrade-prompt.tsx` - Feature Gate UI

### Zu ändernde Dateien
1. `.env.local` - Environment Variables hinzufügen
2. `app/todo-app-client.tsx` - Badge und Button in Header einfügen

### Befehle nach Implementation
```bash
npx supabase db push
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
```

---

## Checkliste

- [ ] Lemon Squeezy Account erstellen
- [ ] Store einrichten
- [ ] Supporter Produkt erstellen
- [ ] API Key generieren
- [ ] Webhook konfigurieren
- [ ] Environment Variables setzen
- [ ] Migration erstellen und ausführen
- [ ] Webhook Handler implementieren
- [ ] Hook und Komponenten erstellen
- [ ] UI integrieren
- [ ] Testen mit Test-Kreditkarte
- [ ] Production Webhook URL aktualisieren
- [ ] Deployen
