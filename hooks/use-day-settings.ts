"use client"

import { useMemo, useCallback } from 'react'
import { useWeekdayDefaults } from './use-weekday-defaults'
import { useDailyOverrides } from './use-daily-overrides'
import type { DailyOverride } from '@/lib/types'

const DEFAULT_START_TIME = '09:00'
const DEFAULT_AVAILABLE_HOURS = 8

interface DaySettings {
  startTime: string
  availableHours: number
  isOverridden: boolean
}

export function useDaySettings(date: string) {
  const { weekdayDefaults, loading: weekdayLoading, updateWeekdayDefault } = useWeekdayDefaults()
  const { getOverride, setOverride, removeOverride, loading: overrideLoading } = useDailyOverrides()

  // Get the weekday (0-6) from the date string
  const weekday = useMemo(() => {
    const d = new Date(date)
    return d.getDay()
  }, [date])

  // Get the effective settings for this date
  const settings: DaySettings = useMemo(() => {
    const override = getOverride(date)

    if (override) {
      return {
        startTime: override.startTime,
        availableHours: override.availableHours,
        isOverridden: true,
      }
    }

    const weekdayDefault = weekdayDefaults[weekday]
    if (weekdayDefault) {
      return {
        startTime: weekdayDefault.startTime,
        availableHours: weekdayDefault.availableHours,
        isOverridden: false,
      }
    }

    // Fallback
    return {
      startTime: DEFAULT_START_TIME,
      availableHours: DEFAULT_AVAILABLE_HOURS,
      isOverridden: false,
    }
  }, [date, weekday, weekdayDefaults, getOverride])

  // Update settings for this specific date (creates override)
  const updateDaySettings = useCallback(async (updates: { startTime?: string; availableHours?: number }) => {
    const newOverride: DailyOverride = {
      date,
      startTime: updates.startTime ?? settings.startTime,
      availableHours: updates.availableHours ?? settings.availableHours,
    }
    await setOverride(newOverride)
  }, [date, settings, setOverride])

  // Remove override (revert to weekday default)
  const resetToDefault = useCallback(async () => {
    await removeOverride(date)
  }, [date, removeOverride])

  // Update the weekday default for this day's weekday
  const updateWeekdayDefaultForDay = useCallback(async (updates: { startTime?: string; availableHours?: number }) => {
    await updateWeekdayDefault(weekday, updates)
  }, [weekday, updateWeekdayDefault])

  return {
    ...settings,
    weekday,
    loading: weekdayLoading || overrideLoading,
    updateDaySettings,
    resetToDefault,
    updateWeekdayDefaultForDay,
  }
}
