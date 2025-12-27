"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'

const SCHEMA = 'mini_todo'

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
      .schema(SCHEMA)
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
