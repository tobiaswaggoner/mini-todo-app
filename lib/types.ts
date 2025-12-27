export interface Todo {
  id: string
  description: string
  category: string
  duration: number // in minutes
  fixedTime?: string // optional, format "HH:mm"
  active: boolean // ob die Aufgabe aktiv/eingeplant ist
  date: string // format "YYYY-MM-DD"
}

export interface CategoryColorMapping {
  category: string
  colorIndex: number
}

export interface WeekdayDefault {
  weekday: number // 0=Sunday, 1=Monday, ..., 6=Saturday (JS getDay() convention)
  startTime: string // format "HH:mm"
  availableHours: number
}

export interface DailyOverride {
  date: string // format "YYYY-MM-DD"
  startTime: string // format "HH:mm"
  availableHours: number
}
