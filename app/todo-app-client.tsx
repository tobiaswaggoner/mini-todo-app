"use client"

import { useTodos } from "@/hooks/use-todos"
import { useSettings } from "@/hooks/use-settings"
import { useCategoryColors } from "@/hooks/use-category-colors"
import { useAuth } from "@/components/auth-provider"
import { LoginPage } from "@/components/login-page"
import type { Todo } from "@/lib/types"
import { BacklogView } from "@/components/backlog-view"
import { DailyPlannerView } from "@/components/daily-planner-view"
import { Button } from "@/components/ui/button"
import { List, LayoutGrid, Loader2 } from "lucide-react"

export function TodoAppClient() {
  const { user, loading: authLoading } = useAuth()
  const { todos, setTodos, loading: todosLoading } = useTodos()
  const {
    view,
    setView,
    startTime,
    setStartTime,
    availableHours,
    setAvailableHours,
    loading: settingsLoading,
  } = useSettings()
  const {
    categoryColorMappings,
    setCategoryColorMappings,
    loading: colorsLoading,
  } = useCategoryColors()

  // Show login if not authenticated
  if (!authLoading && !user) {
    return <LoginPage />
  }

  // Show loading state
  const isLoading = authLoading || todosLoading || settingsLoading || colorsLoading
  if (isLoading) {
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
      <div className="flex justify-center mb-6">
        <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-lg flex gap-1">
          <Button
            variant={view === "backlog" ? "default" : "ghost"}
            onClick={() => setView("backlog")}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            Backlog
          </Button>
          <Button
            variant={view === "planner" ? "default" : "ghost"}
            onClick={() => setView("planner")}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            Tagesplan
          </Button>
        </div>
      </div>

      {view === "backlog" ? (
        <BacklogView
          todos={todos}
          onTodosChange={handleTodosChange}
          startTime={startTime}
          availableHours={availableHours}
          categoryColorMappings={categoryColorMappings}
        />
      ) : (
        <DailyPlannerView
          todos={todos}
          startTime={startTime}
          setStartTime={setStartTime}
          availableHours={availableHours}
          setAvailableHours={setAvailableHours}
          categoryColorMappings={categoryColorMappings}
          setCategoryColorMappings={setCategoryColorMappings}
        />
      )}
    </div>
  )
}
