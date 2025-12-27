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
