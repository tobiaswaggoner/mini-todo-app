"use client"

import { useState, useEffect } from "react"
import type { Todo } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface EditTodoDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onSave: (todo: Todo) => void
  todo: Todo | null
  selectedDate: string
}

export function EditTodoDialog({
  isOpen,
  setIsOpen,
  onSave,
  todo,
  selectedDate,
}: EditTodoDialogProps) {
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [duration, setDuration] = useState(30)
  const [isFixedTime, setIsFixedTime] = useState(false)
  const [fixedTime, setFixedTime] = useState("09:00")
  const [active, setActive] = useState(true)
  const [date, setDate] = useState(selectedDate)

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{todo ? "Aufgabe bearbeiten" : "Neue Aufgabe erstellen"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Beschreibung
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Kategorie
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Dauer (min)
            </Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number.parseInt(e.target.value, 10) || 0)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Datum
            </Label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="col-span-3 px-3 py-2 border rounded-md bg-background text-foreground text-sm font-sans"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Aktiv</Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox id="active" checked={active} onCheckedChange={(checked) => setActive(checked as boolean)} />
              <Label htmlFor="active" className="text-sm">
                Aufgabe für Planung aktivieren
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Fester Termin</Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox
                id="fixed-time"
                checked={isFixedTime}
                onCheckedChange={(checked) => setIsFixedTime(checked as boolean)}
              />
              <Label htmlFor="fixed-time" className="text-sm">
                Feste Uhrzeit zuweisen
              </Label>
            </div>
          </div>
          {isFixedTime && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fixed-time-input" className="text-right">
                Uhrzeit
              </Label>
              <Input
                id="fixed-time-input"
                type="time"
                value={fixedTime}
                onChange={(e) => setFixedTime(e.target.value)}
                className="col-span-3"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
