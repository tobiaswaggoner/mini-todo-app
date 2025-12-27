"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, RotateCcw } from "lucide-react"
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("day")}
          >
            Aktueller Tag
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

        {/* Day Settings Tab */}
        {activeTab === "day" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium capitalize">{formattedDate}</h3>
              {isOverridden && (
                <Button variant="outline" size="sm" onClick={resetToDefault}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Auf Standard zurücksetzen
                </Button>
              )}
            </div>

            {isOverridden && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Dieser Tag hat individuelle Einstellungen (abweichend vom {WEEKDAY_NAMES[weekday]}-Standard).
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="day-start-time">Startzeit</Label>
                <Input
                  id="day-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="day-hours">Verfügbare Stunden</Label>
                <Input
                  id="day-hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={availableHours}
                  onChange={(e) => handleAvailableHoursChange(e.target.value)}
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Änderungen hier erstellen eine Überschreibung für diesen spezifischen Tag.
              {!isOverridden && ` Aktuell werden die Standardwerte für ${WEEKDAY_NAMES[weekday]} verwendet.`}
            </p>
          </div>
        )}

        {/* Weekday Defaults Tab */}
        {activeTab === "weekdays" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Hier können Sie die Standardwerte für jeden Wochentag festlegen.
              Diese werden verwendet, wenn kein tagesspezifischer Override existiert.
            </p>

            <div className="space-y-3">
              {weekdayDefaults.map((wd, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-[120px_1fr_1fr] gap-3 items-center p-2 rounded ${
                    index === weekday ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <span className="font-medium">
                    {WEEKDAY_NAMES[index]}
                    {index === weekday && " (heute)"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-12">Start:</Label>
                    <Input
                      type="time"
                      value={wd.startTime}
                      onChange={(e) => handleWeekdayStartTimeChange(index, e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-12">Stunden:</Label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={wd.availableHours}
                      onChange={(e) => handleWeekdayHoursChange(index, e.target.value)}
                      className="h-8"
                    />
                  </div>
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

            {categoryColorMappings.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Noch keine Kategorien vorhanden.
              </p>
            ) : (
              <div className="space-y-2">
                {categoryColorMappings.map((mapping) => (
                  <div
                    key={mapping.category}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="font-medium">{mapping.category}</span>
                    <div className="flex items-center gap-2">
                      <Select
                        value={mapping.colorIndex.toString()}
                        onValueChange={(value) =>
                          handleUpdateCategoryColor(mapping.category, parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded ${COLORS[mapping.colorIndex].bg}`}
                              />
                              <span>{COLORS[mapping.colorIndex].name}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {COLORS.map((color, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded ${color.bg}`}
                                />
                                <span>{color.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
