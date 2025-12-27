"use client"

import { useMemo } from "react"
import type { Todo, CategoryColorMapping } from "@/lib/types"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { addMinutes, format, parse } from "date-fns"
import { getCategoryColor } from "@/lib/colors"
import { cn } from "@/lib/utils"

interface ScheduledTask {
  todo: Todo
  startTime: Date
  endTime: Date
  isFixed: boolean
  partNumber?: number
  totalParts?: number
}

interface TimeSlot {
  start: Date
  end: Date
  duration: number
}

export function CompactDailyPlanner({
  todos,
  startTime,
  availableHours,
  categoryColorMappings,
}: {
  todos: Todo[]
  startTime: string
  availableHours: number
  categoryColorMappings: CategoryColorMapping[]
}) {
  const { schedule, dayStart, dayEnd, totalDuration } = useMemo(() => {
    const dayStart = parse(startTime, "HH:mm", new Date())
    const dayEnd = addMinutes(dayStart, availableHours * 60)
    const totalDuration = availableHours * 60

    // Nur aktive Aufgaben berücksichtigen
    const activeTodos = todos.filter((todo) => todo.active)
    const fixedTodos = activeTodos.filter((todo) => todo.fixedTime)
    const flexibleTodos = activeTodos.filter((todo) => !todo.fixedTime)

    const schedule: ScheduledTask[] = []

    // Feste Termine einplanen
    const fixedAppointments: ScheduledTask[] = []
    for (const todo of fixedTodos) {
      const appointmentStart = parse(todo.fixedTime!, "HH:mm", new Date())
      const appointmentEnd = addMinutes(appointmentStart, todo.duration)

      if (appointmentStart >= dayStart && appointmentEnd <= dayEnd) {
        fixedAppointments.push({
          todo,
          startTime: appointmentStart,
          endTime: appointmentEnd,
          isFixed: true,
        })
      }
    }

    fixedAppointments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    schedule.push(...fixedAppointments)

    // Verfügbare Zeitslots berechnen
    const availableSlots: TimeSlot[] = []

    if (fixedAppointments.length === 0) {
      availableSlots.push({
        start: dayStart,
        end: dayEnd,
        duration: (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60),
      })
    } else {
      if (fixedAppointments[0].startTime > dayStart) {
        const duration = (fixedAppointments[0].startTime.getTime() - dayStart.getTime()) / (1000 * 60)
        availableSlots.push({
          start: dayStart,
          end: fixedAppointments[0].startTime,
          duration,
        })
      }

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

    // Flexible Aufgaben einplanen
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
          currentSlotIndex++
          if (currentSlotIndex < availableSlots.length) {
            currentSlotPosition = availableSlots[currentSlotIndex].start
          }
          continue
        }

        const timeToUse = Math.min(remainingDuration, availableTimeInSlot)
        const taskStart = currentSlotPosition
        const taskEnd = addMinutes(taskStart, timeToUse)

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
        }

        schedule.push(taskPart)

        remainingDuration -= timeToUse
        currentSlotPosition = taskEnd
        partNumber++

        if (taskEnd >= currentSlot.end) {
          currentSlotIndex++
          if (currentSlotIndex < availableSlots.length) {
            currentSlotPosition = availableSlots[currentSlotIndex].start
          }
        }
      }

      if (remainingDuration > 0) {
        break
      }
    }

    schedule.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    return { schedule, dayStart, dayEnd, totalDuration }
  }, [todos, startTime, availableHours, categoryColorMappings])

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

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Tagesvorschau</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-2 h-[60vh] overflow-y-auto">
          {schedule.map((task, index) => {
            const top = getTopPosition(task.startTime)
            const actualDuration = (task.endTime.getTime() - task.startTime.getTime()) / (1000 * 60)
            const height = (actualDuration / totalDuration) * 100
            const color = getCategoryColor(task.todo.category, categoryColorMappings)

            return (
              <div
                key={`${task.todo.id}-${index}`}
                className={cn(
                  "absolute left-2 right-2 border-l-2 p-1 rounded-r text-xs z-10",
                  // Alle Aufgaben verwenden jetzt ihre Kategoriefarbe
                  `${color.bg} ${color.border} ${color.darkBg} ${color.darkBorder}`,
                )}
                style={{
                  top: `${top}%`,
                  height: `calc(${height}% - 2px)`,
                }}
              >
                <p
                  className={cn(
                    "font-medium text-xs truncate",
                    // Alle Aufgaben verwenden jetzt ihre Kategoriefarbe für den Text
                    `${color.text} ${color.darkText}`,
                  )}
                  title={`${task.todo.description} (${format(task.startTime, "HH:mm")} - ${format(task.endTime, "HH:mm")}, ${formatDuration(actualDuration)})`}
                >
                  {task.todo.description}{" "}
                  <span className={cn("font-normal opacity-80", `${color.text} ${color.darkText}`)}>
                    ({format(task.startTime, "HH:mm")} - {format(task.endTime, "HH:mm")},{" "}
                    {formatDuration(actualDuration)})
                    {task.isFixed && (
                      <span className={cn("ml-1 font-bold", `${color.text} ${color.darkText}`)}>[FEST]</span>
                    )}
                  </span>
                </p>
              </div>
            )
          })}

          {schedule.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm">Keine aktiven Aufgaben</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
