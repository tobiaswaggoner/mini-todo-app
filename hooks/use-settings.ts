"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'

const SCHEMA = 'mini_todo'

type View = 'backlog' | 'planner'

interface Settings {
  view: View
  startTime: string
  availableHours: number
}

const defaultSettings: Settings = {
  view: 'backlog',
  startTime: '09:00',
  availableHours: 8,
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings)
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('user_settings')
      .select('*')
      .single()

    if (!error && data) {
      setSettings({
        view: data.view as View,
        startTime: data.start_time,
        availableHours: Number(data.available_hours),
      })
    } else if (error?.code === 'PGRST116') {
      // No settings found, create default
      await supabase.schema(SCHEMA).from('user_settings').insert({
        user_id: user.id,
        view: defaultSettings.view,
        start_time: defaultSettings.startTime,
        available_hours: defaultSettings.availableHours,
      })
    }
    setLoading(false)
  }, [user, supabase])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    if (!user) return

    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)

    const { error } = await supabase
      .schema(SCHEMA)
      .from('user_settings')
      .upsert({
        user_id: user.id,
        view: newSettings.view,
        start_time: newSettings.startTime,
        available_hours: newSettings.availableHours,
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('Error updating settings:', error)
      fetchSettings()
    }
  }, [user, settings, supabase, fetchSettings])

  return {
    ...settings,
    loading,
    setView: (view: View) => updateSettings({ view }),
    setStartTime: (startTime: string) => updateSettings({ startTime }),
    setAvailableHours: (availableHours: number) => updateSettings({ availableHours }),
  }
}
