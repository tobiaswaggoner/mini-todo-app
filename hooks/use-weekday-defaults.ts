"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import type { WeekdayDefault } from '@/lib/types'

const SCHEMA = 'mini_todo'

const DEFAULT_START_TIME = '09:00'
const DEFAULT_AVAILABLE_HOURS = 8

// Create default settings for all 7 weekdays
function createDefaults(): WeekdayDefault[] {
  return Array.from({ length: 7 }, (_, i) => ({
    weekday: i,
    startTime: DEFAULT_START_TIME,
    availableHours: DEFAULT_AVAILABLE_HOURS,
  }))
}

export function useWeekdayDefaults() {
  const [weekdayDefaults, setWeekdayDefaults] = useState<WeekdayDefault[]>(createDefaults())
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  // Fetch weekday defaults
  const fetchWeekdayDefaults = useCallback(async () => {
    if (!user) {
      setWeekdayDefaults(createDefaults())
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('weekday_defaults')
      .select('*')
      .order('weekday', { ascending: true })

    if (!error && data && data.length > 0) {
      // Fill in any missing weekdays with defaults
      const mapped = createDefaults()
      data.forEach(row => {
        mapped[row.weekday] = {
          weekday: row.weekday,
          startTime: row.start_time,
          availableHours: Number(row.available_hours),
        }
      })
      setWeekdayDefaults(mapped)
    } else if (!error && (!data || data.length === 0)) {
      // No defaults found, create them
      const defaults = createDefaults()
      const inserts = defaults.map(d => ({
        user_id: user.id,
        weekday: d.weekday,
        start_time: d.startTime,
        available_hours: d.availableHours,
      }))

      await supabase.schema(SCHEMA).from('weekday_defaults').insert(inserts)
      setWeekdayDefaults(defaults)
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchWeekdayDefaults()
  }, [fetchWeekdayDefaults])

  // Update a single weekday default
  const updateWeekdayDefault = useCallback(async (weekday: number, updates: Partial<Omit<WeekdayDefault, 'weekday'>>) => {
    if (!user || weekday < 0 || weekday > 6) return

    const current = weekdayDefaults[weekday]
    const updated = { ...current, ...updates }

    // Optimistic update
    const newDefaults = [...weekdayDefaults]
    newDefaults[weekday] = updated
    setWeekdayDefaults(newDefaults)

    const { error } = await supabase
      .schema(SCHEMA)
      .from('weekday_defaults')
      .upsert({
        user_id: user.id,
        weekday,
        start_time: updated.startTime,
        available_hours: updated.availableHours,
      }, { onConflict: 'user_id,weekday' })

    if (error) {
      console.error('Error updating weekday default:', error)
      fetchWeekdayDefaults()
    }
  }, [user, weekdayDefaults, supabase, fetchWeekdayDefaults])

  // Update all weekday defaults at once
  const setAllWeekdayDefaults = useCallback(async (newDefaults: WeekdayDefault[]) => {
    if (!user) return

    // Optimistic update
    setWeekdayDefaults(newDefaults)

    const upserts = newDefaults.map(d => ({
      user_id: user.id,
      weekday: d.weekday,
      start_time: d.startTime,
      available_hours: d.availableHours,
    }))

    const { error } = await supabase
      .schema(SCHEMA)
      .from('weekday_defaults')
      .upsert(upserts, { onConflict: 'user_id,weekday' })

    if (error) {
      console.error('Error updating weekday defaults:', error)
      fetchWeekdayDefaults()
    }
  }, [user, supabase, fetchWeekdayDefaults])

  return {
    weekdayDefaults,
    loading,
    updateWeekdayDefault,
    setAllWeekdayDefaults,
    refetch: fetchWeekdayDefaults,
  }
}
