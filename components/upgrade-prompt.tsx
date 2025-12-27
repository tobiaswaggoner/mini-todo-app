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
