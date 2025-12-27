"use client"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { WeekdayDefault, CategoryColorMapping } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, RotateCcw, Plus, ChevronDown, Menu } from "lucide-react"
import { COLORS } from "@/lib/colors"

const WEEKDAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]

interface SettingsDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  selectedDate: string
  startTime: string
  availableHours: number
  isOverridden: boolean
  updateDaySettings: (updates: { startTime?: string; availableHours?: number }) => Promise<void>
  resetToDefault: () => Promise<void>
  weekdayDefaults: WeekdayDefault[]
  updateWeekdayDefault: (weekday: number, updates: { startTime?: string; availableHours?: number }) => Promise<void>
  categoryColorMappings: CategoryColorMapping[]
  setCategoryColorMappings: (mappings: CategoryColorMapping[]) => Promise<void>
}

export function SettingsDialog({
  isOpen,
  setIsOpen,
  selectedDate,
  startTime,
  availableHours,
  isOverridden,
  updateDaySettings,
  resetToDefault,
  weekdayDefaults,
  updateWeekdayDefault,
  categoryColorMappings,
  setCategoryColorMappings,
}: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<"day" | "weekdays" | "colors">("day")
  const [newCategory, setNewCategory] = useState("")
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null)
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const tabMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setOpenColorPicker(null)
      }
      if (tabMenuRef.current && !tabMenuRef.current.contains(event.target as Node)) {
        setIsTabMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const TAB_LABELS = {
    day: "Individueller Tag",
    weekdays: "Wochentag-Standards",
    colors: "Kategoriefarben"
  }

  const currentDate = new Date(selectedDate)
  const weekday = currentDate.getDay()
  const formattedDate = format(currentDate, "EEEE, d. MMMM", { locale: de })

  const handleStartTimeChange = (value: string) => {
    updateDaySettings({ startTime: value })
  }

  const handleAvailableHoursChange = (value: string) => {
    const hours = parseFloat(value)
    if (!isNaN(hours) && hours > 0) {
      updateDaySettings({ availableHours: hours })
    }
  }

  const handleWeekdayStartTimeChange = (weekdayIndex: number, value: string) => {
    updateWeekdayDefault(weekdayIndex, { startTime: value })
  }

  const handleWeekdayHoursChange = (weekdayIndex: number, value: string) => {
    const hours = parseFloat(value)
    if (!isNaN(hours) && hours > 0) {
      updateWeekdayDefault(weekdayIndex, { availableHours: hours })
    }
  }

  const handleRemoveCategoryColor = (category: string) => {
    const newMappings = categoryColorMappings.filter(m => m.category !== category)
    setCategoryColorMappings(newMappings)
  }

  const handleUpdateCategoryColor = (category: string, colorIndex: number) => {
    const newMappings = categoryColorMappings.map(m =>
      m.category === category ? { ...m, colorIndex } : m
    )
    setCategoryColorMappings(newMappings)
  }

  const handleAddCategory = () => {
    const trimmed = newCategory.trim()
    if (!trimmed) return
    if (categoryColorMappings.some(m => m.category.toLowerCase() === trimmed.toLowerCase())) {
      alert("Diese Kategorie existiert bereits.")
      return
    }
    const newMappings = [...categoryColorMappings, { category: trimmed, colorIndex: categoryColorMappings.length % COLORS.length }]
    setCategoryColorMappings(newMappings)
    setNewCategory("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-visible">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
        </DialogHeader>

        {/* Tabs - Desktop */}
        <div className="hidden sm:flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("day")}
          >
            Individueller Tag
          </Button>
          <Button
            variant={activeTab === "weekdays" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("weekdays")}
          >
            Wochentag-Standards
          </Button>
          <Button
            variant={activeTab === "colors" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("colors")}
          >
            Kategoriefarben
          </Button>
        </div>

        {/* Tabs - Mobile */}
        <div className="sm:hidden border-b pb-2" ref={tabMenuRef}>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
              className="w-full justify-between"
            >
              {TAB_LABELS[activeTab]}
              <Menu className="h-4 w-4" />
            </Button>
            {isTabMenuOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-background border rounded-md shadow-lg py-1">
                {(["day", "weekdays", "colors"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setIsTabMenuOpen(false) }}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-accent ${activeTab === tab ? "font-medium bg-accent" : ""}`}
                  >
                    {TAB_LABELS[tab]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Day Settings Tab */}
        {activeTab === "day" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">{formattedDate}</span>
              {isOverridden && (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetToDefault}>
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Zurücksetzen
                </Button>
              )}
            </div>

            {isOverridden && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Individuelle Einstellungen aktiv.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="day-start-time" className="text-xs">Startzeit</Label>
                <Input
                  id="day-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="day-hours" className="text-xs">Stunden</Label>
                <Input
                  id="day-hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={availableHours}
                  onChange={(e) => handleAvailableHoursChange(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {isOverridden ? "Überschreibt den Wochentag-Standard." : `Nutzt ${WEEKDAY_NAMES[weekday]}-Standard.`}
            </p>
          </div>
        )}

        {/* Weekday Defaults Tab */}
        {activeTab === "weekdays" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Standardwerte für jeden Wochentag.
            </p>

            {/* Header */}
            <div className="grid grid-cols-[1fr_70px_60px] gap-2 px-2 text-xs text-muted-foreground font-medium">
              <span>Tag</span>
              <span>Start</span>
              <span>Std.</span>
            </div>

            <div className="space-y-1 max-h-[40vh] overflow-y-auto">
              {weekdayDefaults.map((wd, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_70px_60px] gap-2 items-center px-2 py-1 rounded bg-gray-50 dark:bg-gray-800"
                >
                  <span className="text-sm truncate">
                    {WEEKDAY_NAMES[index].slice(0, 2)}
                    <span className="hidden sm:inline">{WEEKDAY_NAMES[index].slice(2)}</span>
                  </span>
                  <Input
                    type="time"
                    value={wd.startTime}
                    onChange={(e) => handleWeekdayStartTimeChange(index, e.target.value)}
                    className="h-7 text-xs px-1"
                  />
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={wd.availableHours}
                    onChange={(e) => handleWeekdayHoursChange(index, e.target.value)}
                    className="h-7 text-xs px-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Colors Tab */}
        {activeTab === "colors" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Hier können Sie die Farben für Ihre Kategorien anpassen.
            </p>

            {/* Add new category */}
            <div className="flex gap-2">
              <Input
                placeholder="Neue Kategorie..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAddCategory} disabled={!newCategory.trim()}>
                <Plus className="mr-1 h-4 w-4" />
                Hinzufügen
              </Button>
            </div>

            {categoryColorMappings.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Noch keine Kategorien vorhanden.
              </p>
            ) : (
              <div className="space-y-1 max-h-[35vh] overflow-y-auto">
                {categoryColorMappings.map((mapping) => (
                  <div
                    key={mapping.category}
                    className="flex items-center justify-between px-2 py-1 rounded bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="text-sm">{mapping.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="relative" ref={openColorPicker === mapping.category ? colorPickerRef : null}>
                        <button
                          type="button"
                          onClick={() => setOpenColorPicker(openColorPicker === mapping.category ? null : mapping.category)}
                          className="flex items-center justify-between gap-1 border rounded p-0.5 hover:bg-accent w-[100px]"
                        >
                          <div
                            className={`flex-1 border-l-2 px-1.5 py-0.5 rounded-r text-xs ${COLORS[mapping.colorIndex].bg} ${COLORS[mapping.colorIndex].border} ${COLORS[mapping.colorIndex].text} ${COLORS[mapping.colorIndex].darkBg} ${COLORS[mapping.colorIndex].darkBorder} ${COLORS[mapping.colorIndex].darkText}`}
                          >
                            {COLORS[mapping.colorIndex].name}
                          </div>
                          <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                        </button>
                        {openColorPicker === mapping.category && (
                          <div className="absolute right-0 top-full mt-1 z-[9999] bg-background border rounded-md shadow-lg p-0.5 min-w-[120px] max-h-[200px] overflow-y-auto">
                            {COLORS.map((color, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  handleUpdateCategoryColor(mapping.category, index)
                                  setOpenColorPicker(null)
                                }}
                                className="w-full text-left hover:bg-accent rounded"
                              >
                                <div
                                  className={`border-l-2 px-1.5 py-0.5 rounded-r text-xs ${color.bg} ${color.border} ${color.text} ${color.darkBg} ${color.darkBorder} ${color.darkText}`}
                                >
                                  {color.name}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCategoryColor(mapping.category)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
