"use client"

import { useTranslations } from 'next-intl'
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Todo, CategoryColorMapping } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Pencil, Trash2, Clock, Eye, EyeOff } from "lucide-react"
import { getCategoryColor } from "@/lib/colors"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function SortableTodoItem({
  todo,
  onEdit,
  onDelete,
  onToggleActive,
  categoryColorMappings,
}: {
  todo: Todo
  onEdit: () => void
  onDelete: () => void
  onToggleActive: (id: string) => void
  categoryColorMappings: CategoryColorMapping[]
}) {
  const t = useTranslations('aria')
  const isFixedTime = !!todo.fixedTime

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: todo.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const color = getCategoryColor(todo.category, categoryColorMappings)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full bg-white dark:bg-gray-800 shadow-sm p-0", // p-0 entfernt das Standard-Padding der Card
        isFixedTime && "border-l-4 border-blue-500",
        !todo.active && "opacity-50 bg-gray-50 dark:bg-gray-900",
        isFixedTime && todo.active && "bg-blue-50 dark:bg-blue-950",
      )}
    >
      <div className="flex items-start px-2 py-1.5">
        {" "}
        {/* items-start statt items-center, minimales py */}
        {/* Column 1: Drag Handle oder Clock Icon */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 mt-0.5"
          aria-label={t('moveTask')}
        >
          {isFixedTime ? <Clock className="h-4 w-4 text-blue-500" /> : <GripVertical className="h-4 w-4" />}
        </button>
        {/* Column 2: Content */}
        <div className="flex-grow mx-2 overflow-hidden min-h-0">
          {" "}
          {/* min-h-0 verhindert unnötige Höhe */}
          {/* Row 1: Description */}
          <div className="flex items-center gap-2 leading-tight">
            {" "}
            {/* leading-tight für kompaktere Zeilenhöhe */}
            <p
              className={cn(
                "font-medium truncate text-sm leading-tight", // leading-tight auch hier
                todo.active ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-500 line-through",
              )}
              title={todo.description}
            >
              {todo.description}
            </p>
            {isFixedTime && (
              <Badge
                variant="outline"
                className="text-xs px-1 py-0 h-4 text-blue-600 border-blue-300 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700" // h-4 für feste Höhe
              >
                {todo.fixedTime}
              </Badge>
            )}
          </div>
          {/* Row 2: Category & Time */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-none">
            {" "}
            {/* mt-0.5 statt mt-1, leading-none */}
            <Badge
              variant="secondary"
              className={cn(
                "whitespace-nowrap text-xs px-1.5 py-0 h-4 leading-none", // h-4 und leading-none für minimale Höhe
                todo.active ? color.bg : "bg-gray-200 dark:bg-gray-700",
                todo.active ? color.text : "text-gray-500 dark:text-gray-500",
                todo.active ? color.darkBg : "dark:bg-gray-700",
                todo.active ? color.darkText : "dark:text-gray-500",
                "border-transparent",
              )}
            >
              {todo.category}
            </Badge>
            <span className={cn("leading-none", todo.active ? "" : "line-through")}>{todo.duration} min</span>{" "}
            {/* leading-none */}
          </div>
        </div>
        {/* Column 3: Action Buttons */}
        <div className="flex gap-0.5 ml-auto mt-0.5">
          {" "}
          {/* mt-0.5 für bessere Ausrichtung */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleActive(todo.id)}
            aria-label={todo.active ? t('deactivateTask') : t('activateTask')}
            className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            {todo.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}{" "}
            {/* h-3 w-3 für kleinere Icons */}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label={t('editTask')}
            className="h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={t('deleteTask')}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
