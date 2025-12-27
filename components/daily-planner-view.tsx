"use client"

import { useState, useMemo, useEffect } from "react"
import type { Todo, CategoryColorMapping } from "@/lib/types"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { addMinutes, format, parse, startOfHour, differenceInHours } from "date-fns"
import { de } from "date-fns/locale"
import { getCategoryColor } from "@/lib/colors"
import { cn } from "@/lib/utils"

interface ScheduledTask {
  todo: Todo
  startTime: Date
  endTime: Date
  isFixed: boolean
  partNumber?: number
  totalParts?: number
  remainingDuration?: number
}

interface CategorySummary {
  category: string
  totalMinutes: number
  color: ReturnType<typeof getCategoryColor>
}

interface TimeSlot {
  start: Date
  end: Date
  duration: number
}

interface DailyPlannerViewProps {
  todos: Todo[]
  selectedDate: string
  startTime: string
  availableHours: number
  categoryColorMappings: CategoryColorMapping[]
}

export function DailyPlannerView({
  todos,
  selectedDate,
  startTime,
  availableHours,
  categoryColorMappings,
}: DailyPlannerViewProps) {
  const [now, setNow] = useState(new Date())

  // Format the selected date for display
  const formattedDate = format(new Date(selectedDate), "EEEE, d. MMMM", { locale: de })

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const { schedule, totalDuration, dayStart, hourMarkers, categoryStats } = useMemo(() => {
    const dayStart = parse(startTime, "HH:mm", new Date())
    const dayEnd = addMinutes(dayStart, availableHours * 60)
    const totalDuration = availableHours * 60

    // NUR AKTIVE Aufgaben berücksichtigen
    const activeTodos = todos.filter((todo) => todo.active)
    const fixedTodos = activeTodos.filter((todo) => todo.fixedTime)
    const flexibleTodos = activeTodos.filter((todo) => !todo.fixedTime)

    const schedule: ScheduledTask[] = []

    // 1. Erst alle festen Termine einplanen
    const fixedAppointments: ScheduledTask[] = []
    for (const todo of fixedTodos) {
      const appointmentStart = parse(todo.fixedTime!, "HH:mm", new Date())
      const appointmentEnd = addMinutes(appointmentStart, todo.duration)

      // Nur einplanen, wenn der Termin in das Tageszeitfenster passt
      if (appointmentStart >= dayStart && appointmentEnd <= dayEnd) {
        fixedAppointments.push({
          todo,
          startTime: appointmentStart,
          endTime: appointmentEnd,
          isFixed: true,
        })
      }
    }

    // Sortiere feste Termine nach Startzeit
    fixedAppointments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    schedule.push(...fixedAppointments)

    // 2. Berechne verfügbare Zeitslots zwischen den festen Terminen
    const availableSlots: TimeSlot[] = []

    // Slot vor dem ersten festen Termin
    if (fixedAppointments.length === 0) {
      availableSlots.push({
        start: dayStart,
        end: dayEnd,
        duration: (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60),
      })
    } else {
      // Slot vor dem ersten festen Termin
      if (fixedAppointments[0].startTime > dayStart) {
        const duration = (fixedAppointments[0].startTime.getTime() - dayStart.getTime()) / (1000 * 60)
        availableSlots.push({
          start: dayStart,
          end: fixedAppointments[0].startTime,
          duration,
        })
      }

      // Slots zwischen den festen Terminen
      for (let i = 0; i < fixedAppointments.length - 1; i++) {
        const slotStart = fixedAppointments[i].endTime
        const slotEnd = fixedAppointments[i + 1].startTime
        const duration = (slotEnd.getTime() - slotStart.getTime()) / (1000 * 60)

        if (duration > 0) {
          availableSlots.push({
            start: slotStart,
            end: slotEnd,
            duration,
          })
        }
      }

      // Slot nach dem letzten festen Termin
      const lastFixed = fixedAppointments[fixedAppointments.length - 1]
      if (lastFixed.endTime < dayEnd) {
        const duration = (dayEnd.getTime() - lastFixed.endTime.getTime()) / (1000 * 60)
        availableSlots.push({
          start: lastFixed.endTime,
          end: dayEnd,
          duration,
        })
      }
    }

    // 3. Flexible Aufgaben in die verfügbaren Slots einplanen (mit Teilung)
    let currentSlotIndex = 0
    let currentSlotPosition = availableSlots[0]?.start || dayStart

    for (const todo of flexibleTodos) {
      let remainingDuration = todo.duration
      let partNumber = 1
      const totalPartsNeeded = Math.ceil(todo.duration / Math.max(...availableSlots.map((slot) => slot.duration)))

      while (remainingDuration > 0 && currentSlotIndex < availableSlots.length) {
        const currentSlot = availableSlots[currentSlotIndex]
        const availableTimeInSlot = (currentSlot.end.getTime() - currentSlotPosition.getTime()) / (1000 * 60)

        if (availableTimeInSlot <= 0) {
          // Aktueller Slot ist voll, zum nächsten wechseln
          currentSlotIndex++
          if (currentSlotIndex < availableSlots.length) {
            currentSlotPosition = availableSlots[currentSlotIndex].start
          }
          continue
        }

        // Bestimme, wie viel Zeit in diesem Slot verwendet werden kann
        const timeToUse = Math.min(remainingDuration, availableTimeInSlot)
        const taskStart = currentSlotPosition
        const taskEnd = addMinutes(taskStart, timeToUse)

        // Erstelle Aufgabenteil
        const taskPart: ScheduledTask = {
          todo: {
            ...todo,
            description:
              totalPartsNeeded > 1 ? `${todo.description} (${partNumber}/${totalPartsNeeded})` : todo.description,
          },
          startTime: taskStart,
          endTime: taskEnd,
          isFixed: false,
          partNumber: totalPartsNeeded > 1 ? partNumber : undefined,
          totalParts: totalPartsNeeded > 1 ? totalPartsNeeded : undefined,
          remainingDuration: remainingDuration - timeToUse,
        }

        schedule.push(taskPart)

        // Aktualisiere Zustand
        remainingDuration -= timeToUse
        currentSlotPosition = taskEnd
        partNumber++

        // Wenn der aktuelle Slot voll ist, zum nächsten wechseln
        if (taskEnd >= currentSlot.end) {
          currentSlotIndex++
          if (currentSlotIndex < availableSlots.length) {
            currentSlotPosition = availableSlots[currentSlotIndex].start
          }
        }
      }

      // Wenn nicht die gesamte Aufgabe eingeplant werden konnte, breche ab
      if (remainingDuration > 0) {
        break
      }
    }

    // Sortiere das finale Schedule nach Startzeit
    schedule.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    // Berechne Kategorie-Statistiken NUR für tatsächlich eingeplante Aufgaben
    const categoryMap = new Map<string, number>()

    for (const task of schedule) {
      const category = task.todo.category
      // Berechne die tatsächliche Dauer dieses Aufgabenteils
      const actualDuration = (task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60)
      const currentMinutes = categoryMap.get(category) || 0
      categoryMap.set(category, currentMinutes + actualDuration)
    }

    const categoryStats: CategorySummary[] = Array.from(categoryMap.entries())
      .map(([category, totalMinutes]) => ({
        category,
        totalMinutes,
        color: getCategoryColor(category, categoryColorMappings),
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes) // Sortiere nach Zeit (absteigend)

    // Erstelle Stunden-Marker
    const hourMarkers = []
    const firstHour = startOfHour(dayStart)
    const numHours = differenceInHours(dayEnd, firstHour) + 1
    for (let i = 0; i < numHours; i++) {
      const hour = addMinutes(firstHour, i * 60)
      if (hour >= dayStart && hour < dayEnd) {
        hourMarkers.push(hour)
      }
    }

    return { schedule, totalDuration, dayStart, dayEnd, hourMarkers, categoryStats }
  }, [startTime, availableHours, todos, categoryColorMappings])

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainingMins}min`
  }

  const getTopPosition = (time: Date) => {
    const minutesFromStart = (time.getTime() - dayStart.getTime()) / (1000 * 60)
    return (minutesFromStart / totalDuration) * 100
  }

  const currentTimePosition = getTopPosition(now)

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="mb-2 capitalize">{formattedDate}</CardTitle>
        {/* Kompakte Legende - zeigt nur tatsächlich eingeplante Zeit */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {categoryStats.map((stat) => (
            <div key={stat.category} className="flex items-center gap-1">
              <div
                className={cn(
                  "w-3 h-3 rounded-sm border",
                  stat.color.bg,
                  stat.color.border,
                  stat.color.darkBg,
                  stat.color.darkBorder,
                )}
              />
              <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {stat.category}: {formatTime(stat.totalMinutes)}
              </span>
            </div>
          ))}
          {categoryStats.length > 0 && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
              <span className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                Gesamt: {formatTime(categoryStats.reduce((sum, stat) => sum + stat.totalMinutes, 0))}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-[70vh] overflow-y-auto">
          {/* Zeitmarker im Hintergrund */}
          {hourMarkers.map((hour, index) => (
            <div
              key={index}
              className="absolute left-0 right-4 h-px bg-gray-300 dark:bg-gray-700 z-0"
              style={{ top: `${getTopPosition(hour)}%` }}
            >
              <span className="absolute -left-12 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {format(hour, "HH:mm")}
              </span>
            </div>
          ))}

          {/* Geplante Aufgaben */}
          {schedule.map((task, index) => {
            const top = getTopPosition(task.startTime)
            const actualDuration = (task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60)
            const height = (actualDuration / totalDuration) * 100
            const color = getCategoryColor(task.todo.category, categoryColorMappings)

            return (
              <div
                key={`${task.todo.id}-${index}`}
                className={cn(
                  "absolute left-4 right-4 border-l-4 p-2 rounded-r-md z-10",
                  // Alle Aufgaben verwenden jetzt ihre Kategoriefarbe (mit festen Zuordnungen)
                  `${color.bg} ${color.border} ${color.darkBg} ${color.darkBorder}`,
                )}
                style={{
                  top: `${top}%`,
                  height: `calc(${height}% - 4px)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <p className={cn("font-bold text-sm truncate flex-grow", `${color.text} ${color.darkText}`)}>
                    {task.todo.description}{" "}
                    <span className={cn("font-normal text-xs opacity-80", `${color.text} ${color.darkText}`)}>
                      ({format(task.startTime, "HH:mm")} - {format(task.endTime, "HH:mm")},{" "}
                      {formatDuration(actualDuration)})
                    </span>
                  </p>
                  {task.isFixed && (
                    <span
                      className={cn(
                        "text-xs px-1 rounded font-medium",
                        `${color.text} ${color.darkText}`,
                        "bg-black/10 dark:bg-white/10",
                      )}
                    >
                      FEST
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Aktuelle Zeit-Linie */}
          {currentTimePosition >= 0 && currentTimePosition <= 100 && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-red-500 flex items-center z-20"
              style={{ top: `${currentTimePosition}%` }}
            >
              <div className="absolute -left-12 text-xs text-red-500 font-bold">{format(now, "HH:mm")}</div>
              <div className="h-2 w-2 bg-red-500 rounded-full -ml-1"></div>
            </div>
          )}

          {schedule.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-gray-500 dark:text-gray-400">
                Keine aktiven Aufgaben für diesen Tag.
                <br />
                Wechseln Sie zur Planung-Ansicht um Aufgaben hinzuzufügen.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
