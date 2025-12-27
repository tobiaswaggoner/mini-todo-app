"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import type { DailyOverride } from '@/lib/types'

const SCHEMA = 'mini_todo'

export function useDailyOverrides() {
  const [overrides, setOverrides] = useState<Map<string, DailyOverride>>(new Map())
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  // Fetch all daily overrides for the user
  const fetchOverrides = useCallback(async () => {
    if (!user) {
      setOverrides(new Map())
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('daily_overrides')
      .select('*')

    if (!error && data) {
      const map = new Map<string, DailyOverride>()
      data.forEach(row => {
        map.set(row.date, {
          date: row.date,
          startTime: row.start_time,
          availableHours: Number(row.available_hours),
        })
      })
      setOverrides(map)
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchOverrides()
  }, [fetchOverrides])

  // Get override for a specific date (or undefined if none)
  const getOverride = useCallback((date: string): DailyOverride | undefined => {
    return overrides.get(date)
  }, [overrides])

  // Set or update override for a specific date
  const setOverride = useCallback(async (override: DailyOverride) => {
    if (!user) return

    // Optimistic update
    const newOverrides = new Map(overrides)
    newOverrides.set(override.date, override)
    setOverrides(newOverrides)

    const { error } = await supabase
      .schema(SCHEMA)
      .from('daily_overrides')
      .upsert({
        user_id: user.id,
        date: override.date,
        start_time: override.startTime,
        available_hours: override.availableHours,
      }, { onConflict: 'user_id,date' })

    if (error) {
      console.error('Error setting daily override:', error)
      fetchOverrides()
    }
  }, [user, overrides, supabase, fetchOverrides])

  // Remove override for a specific date (revert to weekday default)
  const removeOverride = useCallback(async (date: string) => {
    if (!user) return

    // Optimistic update
    const newOverrides = new Map(overrides)
    newOverrides.delete(date)
    setOverrides(newOverrides)

    const { error } = await supabase
      .schema(SCHEMA)
      .from('daily_overrides')
      .delete()
      .eq('date', date)

    if (error) {
      console.error('Error removing daily override:', error)
      fetchOverrides()
    }
  }, [user, overrides, supabase, fetchOverrides])

  return {
    overrides,
    loading,
    getOverride,
    setOverride,
    removeOverride,
    refetch: fetchOverrides,
  }
}
