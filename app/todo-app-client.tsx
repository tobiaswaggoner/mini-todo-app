"use client"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Todo } from "@/lib/types"
import type { CategoryColorMapping } from "@/lib/colors"
import { BacklogView } from "@/components/backlog-view"
import { DailyPlannerView } from "@/components/daily-planner-view"
import { Button } from "@/components/ui/button"
import { List, LayoutGrid } from "lucide-react"

type View = "backlog" | "planner"

export function TodoAppClient() {
  const [todos, setTodos] = useLocalStorage<Todo[]>("mini-todos-backlog", [])
  const [view, setView] = useLocalStorage<View>("mini-todos-view", "backlog")
  const [startTime, setStartTime] = useLocalStorage<string>("mini-todos-startTime", "09:00")
  const [availableHours, setAvailableHours] = useLocalStorage<number>("mini-todos-availableHours", 8)
  const [categoryColorMappings, setCategoryColorMappings] = useLocalStorage<CategoryColorMapping[]>(
    "mini-todos-categoryColors",
    [],
  )

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
