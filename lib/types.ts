export interface Todo {
  id: string
  description: string
  category: string
  duration: number // in minutes
  fixedTime?: string // optional, format "HH:mm"
  active: boolean // neu: ob die Aufgabe aktiv/eingeplant ist
}

export interface CategoryColorMapping {
  category: string
  colorIndex: number
}
