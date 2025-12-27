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
