"use client"

import type React from "react"
import type { Todo, CategoryColorMapping } from "@/lib/types"
import { useState, useRef } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableTodoItem } from "./sortable-todo-item"
import { CompactDailyPlanner } from "./compact-daily-planner"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload, Download } from "lucide-react"
import { EditTodoDialog } from "./edit-todo-dialog"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function BacklogView({
  todos,
  onTodosChange,
  startTime,
  availableHours,
  categoryColorMappings,
}: {
  todos: Todo[]
  onTodosChange: (todos: Todo[]) => void
  startTime: string
  availableHours: number
  categoryColorMappings: CategoryColorMapping[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((t) => t.id === active.id)
      const newIndex = todos.findIndex((t) => t.id === over.id)
      const newOrder = arrayMove(todos, oldIndex, newIndex)
      onTodosChange(newOrder)
    }
  }

  const handleSaveTodo = (todo: Todo) => {
    let newTodos
    if (editingTodo) {
      newTodos = todos.map((t) => (t.id === todo.id ? todo : t))
    } else {
      newTodos = [...todos, todo]
    }
    onTodosChange(newTodos)
    setEditingTodo(null)
  }

  const handleDeleteTodo = (id: string) => {
    const newTodos = todos.filter((t) => t.id !== id)
    onTodosChange(newTodos)
  }

  const handleToggleActive = (id: string) => {
    const newTodos = todos.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    onTodosChange(newTodos)
  }

  const openNewTodoDialog = () => {
    setEditingTodo(null)
    setIsDialogOpen(true)
  }

  const openEditTodoDialog = (todo: Todo) => {
    setEditingTodo(todo)
    setIsDialogOpen(true)
  }

  const handleExport = () => {
    if (todos.length === 0) {
      alert("Keine Aufgaben zum Exportieren vorhanden.")
      return
    }
    const dataStr = JSON.stringify(todos, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "mini-todo-backup.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result
        if (typeof text === "string") {
          const importedTodos = JSON.parse(text)
          if (Array.isArray(importedTodos)) {
            // Stelle sicher, dass alle Todos das active-Flag haben
            const todosWithActive = importedTodos.map((todo) => ({
              ...todo,
              active: todo.active !== undefined ? todo.active : true,
            }))
            onTodosChange(todosWithActive)
          } else {
            alert("Fehler: Die importierte Datei hat kein gültiges Format.")
          }
        }
      } catch (error) {
        console.error("Fehler beim Importieren der Datei:", error)
        alert("Die Datei konnte nicht gelesen werden. Stellen Sie sicher, dass es eine gültige JSON-Datei ist.")
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Backlog - nimmt 2/3 der Breite ein */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Aufgaben-Backlog</CardTitle>
            <div className="flex items-center gap-2">
              <input type="file" ref={importInputRef} onChange={handleImport} className="hidden" accept=".json" />
              <Button size="sm" variant="outline" onClick={() => importInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm" onClick={openNewTodoDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Neue Aufgabe
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={todos} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {todos.length > 0 ? (
                    todos.map((todo) => (
                      <SortableTodoItem
                        key={todo.id}
                        todo={todo}
                        onEdit={() => openEditTodoDialog(todo)}
                        onDelete={() => handleDeleteTodo(todo.id)}
                        onToggleActive={handleToggleActive}
                        categoryColorMappings={categoryColorMappings}
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Keine Aufgaben im Backlog. Importieren Sie eine Liste oder fügen Sie eine neue Aufgabe hinzu.
                    </p>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>

      {/* Tagesvorschau - nimmt 1/3 der Breite ein */}
      <div className="lg:col-span-1">
        <CompactDailyPlanner
          todos={todos}
          startTime={startTime}
          availableHours={availableHours}
          categoryColorMappings={categoryColorMappings}
        />
      </div>

      <EditTodoDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} onSave={handleSaveTodo} todo={editingTodo} />
    </div>
  )
}
