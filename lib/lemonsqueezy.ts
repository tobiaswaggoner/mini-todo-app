const STORE_SLUG = 'mini-todo-planner'
const VARIANT_ID = process.env.NEXT_PUBLIC_LEMONSQUEEZY_SUPPORTER_VARIANT_ID || '747123'

export function getCheckoutUrl(userId: string): string {
  const checkoutUrl = new URL(`https://${STORE_SLUG}.lemonsqueezy.com/buy/${VARIANT_ID}`)

  // User ID als custom data für Webhook übergeben
  checkoutUrl.searchParams.set('checkout[custom][user_id]', userId)

  // Erfolgs-Redirect zurück zur App
  if (typeof window !== 'undefined') {
    checkoutUrl.searchParams.set('checkout[success_url]', `${window.location.origin}?upgraded=true`)
  }

  return checkoutUrl.toString()
}

export function getCustomerPortalUrl(): string {
  return `https://${STORE_SLUG}.lemonsqueezy.com/billing`
}
