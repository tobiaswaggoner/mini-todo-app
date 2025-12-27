"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { format } from "date-fns"
import { useTodos } from "@/hooks/use-todos"
import { useSettings } from "@/hooks/use-settings"
import { useCategoryColors } from "@/hooks/use-category-colors"
import { useDaySettings } from "@/hooks/use-day-settings"
import { useWeekdayDefaults } from "@/hooks/use-weekday-defaults"
import { useAuth } from "@/components/auth-provider"
import { LoginPage } from "@/components/login-page"
import type { Todo } from "@/lib/types"
import { BacklogView } from "@/components/backlog-view"
import { DailyPlannerView } from "@/components/daily-planner-view"
import { DateNavigation } from "@/components/date-navigation"
import { Button } from "@/components/ui/button"
import { List, LayoutGrid, Loader2 } from "lucide-react"

export function TodoAppClient() {
  const t = useTranslations('navigation')
  const { user, loading: authLoading } = useAuth()

  // Selected date state (default to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )

  // Track if we've done the initial load
  const hasInitiallyLoaded = useRef(false)

  // Fetch todos for the selected date
  const { todos, setTodos, loading: todosLoading, moveTodoToDate } = useTodos(selectedDate)

  // View settings (backlog vs planner)
  const { view, setView, loading: settingsLoading } = useSettings()

  // Day-specific settings (start time, available hours)
  const {
    startTime,
    availableHours,
    isOverridden,
    loading: daySettingsLoading,
    updateDaySettings,
    resetToDefault,
  } = useDaySettings(selectedDate)

  // Weekday defaults (for settings dialog)
  const {
    weekdayDefaults,
    updateWeekdayDefault,
    loading: weekdayDefaultsLoading,
  } = useWeekdayDefaults()

  // Category colors
  const {
    categoryColorMappings,
    setCategoryColorMappings,
    loading: colorsLoading,
  } = useCategoryColors()

  // Check if still doing initial load
  const isInitialLoading = authLoading || settingsLoading || colorsLoading || weekdayDefaultsLoading

  // Mark as initially loaded once all initial data is loaded
  useEffect(() => {
    if (!isInitialLoading && !hasInitiallyLoaded.current) {
      hasInitiallyLoaded.current = true
    }
  }, [isInitialLoading])

  // Show login if not authenticated
  if (!authLoading && !user) {
    return <LoginPage />
  }

  // Show loading state only for initial load
  if (!hasInitiallyLoaded.current && isInitialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const handleTodosChange = (updatedTodos: Todo[]) => {
    setTodos(updatedTodos)
  }

  return (
    <div>
      {/* View Switcher with Date Navigation */}
      <div className="flex justify-center items-center gap-3 mb-4">
        <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg flex gap-1">
          <Button
            variant={view === "backlog" ? "default" : "ghost"}
            onClick={() => setView("backlog")}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            {t('planning')}
          </Button>
          <Button
            variant={view === "planner" ? "default" : "ghost"}
            onClick={() => setView("planner")}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            {t('dailyPlan')}
          </Button>
        </div>

        <DateNavigation
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      {view === "backlog" ? (
        <BacklogView
          todos={todos}
          onTodosChange={handleTodosChange}
          selectedDate={selectedDate}
          startTime={startTime}
          availableHours={availableHours}
          isOverridden={isOverridden}
          updateDaySettings={updateDaySettings}
          resetToDefault={resetToDefault}
          weekdayDefaults={weekdayDefaults}
          updateWeekdayDefault={updateWeekdayDefault}
          categoryColorMappings={categoryColorMappings}
          setCategoryColorMappings={setCategoryColorMappings}
          moveTodoToDate={moveTodoToDate}
        />
      ) : (
        <DailyPlannerView
          todos={todos}
          selectedDate={selectedDate}
          startTime={startTime}
          availableHours={availableHours}
          categoryColorMappings={categoryColorMappings}
        />
      )}
    </div>
  )
}
