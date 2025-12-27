"use client"

import { format, addDays, subDays, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DateNavigationProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

export function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  const currentDate = new Date(selectedDate)
  const isTodaySelected = isToday(currentDate)

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDateChange(format(subDays(currentDate, 1), 'yyyy-MM-dd'))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant={isTodaySelected ? "default" : "outline"}
        size="sm"
        onClick={() => onDateChange(format(new Date(), 'yyyy-MM-dd'))}
      >
        Heute
      </Button>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => e.target.value && onDateChange(e.target.value)}
        className="px-3 py-2 border rounded-md bg-background text-foreground text-sm font-sans"
      />

      <Button
        variant="outline"
        size="icon"
        onClick={() => onDateChange(format(addDays(currentDate, 1), 'yyyy-MM-dd'))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
