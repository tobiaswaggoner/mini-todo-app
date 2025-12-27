import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import type { Locale } from './config'

const localeMap = {
  de: de,
  en: enUS,
}

export function formatDate(date: Date, formatStr: string, locale: Locale): string {
  return format(date, formatStr, { locale: localeMap[locale] })
}

export function formatDuration(minutes: number, locale: Locale): string {
  const hourSuffix = 'h'
  const minSuffix = 'min'

  if (minutes < 60) {
    return `${minutes}${minSuffix}`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  if (remainingMins === 0) {
    return `${hours}${hourSuffix}`
  }
  return `${hours}${hourSuffix} ${remainingMins}${minSuffix}`
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}
