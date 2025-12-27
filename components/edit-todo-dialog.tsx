"use client"

import { useState, useEffect, useRef } from "react"
import type { Todo } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown } from "lucide-react"

interface EditTodoDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onSave: (todo: Todo) => void
  todo: Todo | null
  selectedDate: string
  existingCategories?: string[]
}

export function EditTodoDialog({
  isOpen,
  setIsOpen,
  onSave,
  todo,
  selectedDate,
  existingCategories = [],
}: EditTodoDialogProps) {
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [duration, setDuration] = useState(30)
  const [isFixedTime, setIsFixedTime] = useState(false)
  const [fixedTime, setFixedTime] = useState("09:00")
  const [active, setActive] = useState(true)
  const [date, setDate] = useState(selectedDate)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (todo) {
      setDescription(todo.description)
      setCategory(todo.category)
      setDuration(todo.duration)
      setIsFixedTime(!!todo.fixedTime)
      setFixedTime(todo.fixedTime || "09:00")
      setActive(todo.active)
      setDate(todo.date)
    } else {
      setDescription("")
      setCategory("")
      setDuration(30)
      setIsFixedTime(false)
      setFixedTime("09:00")
      setActive(true)
      setDate(selectedDate)
    }
  }, [todo, isOpen, selectedDate])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = () => {
    if (!description.trim() || !category.trim() || duration <= 0) {
      alert("Bitte füllen Sie alle Felder korrekt aus.")
      return
    }
    onSave({
      id: todo?.id || crypto.randomUUID(),
      description,
      category,
      duration,
      fixedTime: isFixedTime ? fixedTime : undefined,
      active,
      date,
    })
    setIsOpen(false)
  }

  const filteredCategories = existingCategories.filter(
    c => c.toLowerCase().includes(category.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-base">{todo ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Beschreibung */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs">Beschreibung</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-8 text-sm"
              placeholder="Was ist zu tun?"
            />
          </div>

          {/* Kategorie + Dauer in einer Zeile */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1" ref={categoryRef}>
              <Label htmlFor="category" className="text-xs">Kategorie</Label>
              <div className="relative">
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    setShowCategoryDropdown(true)
                  }}
                  onFocus={() => setShowCategoryDropdown(true)}
                  className="h-8 text-sm pr-7"
                  placeholder="z.B. Arbeit"
                  autoComplete="off"
                />
                {existingCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                  >
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </button>
                )}
                {showCategoryDropdown && filteredCategories.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-background border rounded-md shadow-lg py-1 max-h-[150px] overflow-y-auto">
                    {filteredCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat)
                          setShowCategoryDropdown(false)
                        }}
                        className="w-full px-2 py-1 text-xs text-left hover:bg-accent"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="duration" className="text-xs">Dauer (min)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number.parseInt(e.target.value, 10) || 0)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Datum */}
          <div className="space-y-1">
            <Label htmlFor="date" className="text-xs">Datum</Label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="w-full h-8 px-2 border rounded-md bg-background text-foreground text-sm"
            />
          </div>

          {/* Checkboxen */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                id="active"
                checked={active}
                onCheckedChange={(checked) => setActive(checked as boolean)}
                className="h-4 w-4"
              />
              <span className="text-xs">Aktiv</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                id="fixed-time"
                checked={isFixedTime}
                onCheckedChange={(checked) => setIsFixedTime(checked as boolean)}
                className="h-4 w-4"
              />
              <span className="text-xs">Feste Uhrzeit</span>
            </label>
          </div>

          {/* Uhrzeit (nur wenn feste Uhrzeit aktiviert) */}
          {isFixedTime && (
            <div className="space-y-1">
              <Label htmlFor="fixed-time-input" className="text-xs">Uhrzeit</Label>
              <Input
                id="fixed-time-input"
                type="time"
                value={fixedTime}
                onChange={(e) => setFixedTime(e.target.value)}
                className="h-8 text-sm w-32"
              />
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button size="sm" onClick={handleSubmit}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
