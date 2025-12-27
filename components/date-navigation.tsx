"use client"

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { format, addDays, subDays, isToday } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/i18n-provider'

interface DateNavigationProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

export function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  const t = useTranslations('common')
  const { locale } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const currentDate = new Date(selectedDate)
  const isTodaySelected = isToday(currentDate)

  const dateLocale = locale === 'de' ? de : enUS
  const formattedDate = format(currentDate, 'd. MMM', { locale: dateLocale })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDateChange = (newDate: string) => {
    onDateChange(newDate)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5"
      >
        <CalendarIcon className="h-3.5 w-3.5" />
        <span>{formattedDate}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-x-0 top-auto mt-2 mx-3 sm:absolute sm:inset-auto sm:right-0 sm:mx-0 z-50 bg-background border rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleDateChange(format(subDays(currentDate, 1), 'yyyy-MM-dd'))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant={isTodaySelected ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              onClick={() => handleDateChange(format(new Date(), 'yyyy-MM-dd'))}
            >
              {t('today')}
            </Button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && handleDateChange(e.target.value)}
              className="px-2 py-1.5 border rounded-md bg-background text-foreground text-sm font-sans min-w-0 flex-1 sm:flex-none"
            />

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => handleDateChange(format(addDays(currentDate, 1), 'yyyy-MM-dd'))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
