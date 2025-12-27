import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!

function verifySignature(payload: string, signature: string): boolean {
  if (!signature || !WEBHOOK_SECRET) {
    return false
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
  const digest = hmac.update(payload).digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, 'utf8'),
      Buffer.from(signature, 'utf8')
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('X-Signature') || ''

  if (!verifySignature(payload, signature)) {
    console.error('Webhook signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName = event.meta?.event_name
  const data = event.data?.attributes

  // User ID aus custom_data extrahieren
  const userId = event.meta?.custom_data?.user_id
  if (!userId) {
    console.error('No user_id in webhook custom_data:', event.meta)
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
  }

  console.log(`Processing ${eventName} for user ${userId}`)

  const supabase = createAdminClient()

  // Status mapping von Lemon Squeezy zu unserer DB
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
    current_period_end: data.renews_at || data.ends_at || null,
    updated_at: new Date().toISOString(),
  }

  // Upsert subscription in mini_todo schema
  const { error } = await supabase
    .schema('mini_todo')
    .from('subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  console.log(`Successfully updated subscription for user ${userId}: ${data.status}`)
  return NextResponse.json({ success: true })
}
