// Eine vordefinierte Palette von Farben für die Kategorien.
const COLORS = [
  {
    bg: "bg-sky-200",
    border: "border-sky-500",
    text: "text-sky-800",
    darkBg: "dark:bg-sky-900",
    darkBorder: "dark:border-sky-500",
    darkText: "dark:text-sky-100",
    name: "Himmelblau",
  },
  {
    bg: "bg-emerald-200",
    border: "border-emerald-500",
    text: "text-emerald-800",
    darkBg: "dark:bg-emerald-900",
    darkBorder: "dark:border-emerald-500",
    darkText: "dark:text-emerald-100",
    name: "Smaragd",
  },
  {
    bg: "bg-amber-200",
    border: "border-amber-500",
    text: "text-amber-800",
    darkBg: "dark:bg-amber-900",
    darkBorder: "dark:border-amber-500",
    darkText: "dark:text-amber-100",
    name: "Bernstein",
  },
  {
    bg: "bg-rose-200",
    border: "border-rose-500",
    text: "text-rose-800",
    darkBg: "dark:bg-rose-900",
    darkBorder: "dark:border-rose-500",
    darkText: "dark:text-rose-100",
    name: "Rose",
  },
  {
    bg: "bg-indigo-200",
    border: "border-indigo-500",
    text: "text-indigo-800",
    darkBg: "dark:bg-indigo-900",
    darkBorder: "dark:border-indigo-500",
    darkText: "dark:text-indigo-100",
    name: "Indigo",
  },
  {
    bg: "bg-fuchsia-200",
    border: "border-fuchsia-500",
    text: "text-fuchsia-800",
    darkBg: "dark:bg-fuchsia-900",
    darkBorder: "dark:border-fuchsia-500",
    darkText: "dark:text-fuchsia-100",
    name: "Fuchsia",
  },
  {
    bg: "bg-teal-200",
    border: "border-teal-500",
    text: "text-teal-800",
    darkBg: "dark:bg-teal-900",
    darkBorder: "dark:border-teal-500",
    darkText: "dark:text-teal-100",
    name: "Türkis",
  },
  {
    bg: "bg-orange-200",
    border: "border-orange-500",
    text: "text-orange-800",
    darkBg: "dark:bg-orange-900",
    darkBorder: "dark:border-orange-500",
    darkText: "dark:text-orange-100",
    name: "Orange",
  },
  {
    bg: "bg-lime-200",
    border: "border-lime-500",
    text: "text-lime-800",
    darkBg: "dark:bg-lime-900",
    darkBorder: "dark:border-lime-500",
    darkText: "dark:text-lime-100",
    name: "Limette",
  },
  {
    bg: "bg-violet-200",
    border: "border-violet-500",
    text: "text-violet-800",
    darkBg: "dark:bg-violet-900",
    darkBorder: "dark:border-violet-500",
    darkText: "dark:text-violet-100",
    name: "Violett",
  },
]

export interface CategoryColorMapping {
  category: string
  colorIndex: number
}

/**
 * Erzeugt einen einfachen Hash-Code für einen String.
 * @param str Der Eingabe-String (z.B. die Kategorie).
 * @returns Ein numerischer Hash-Code.
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Konvertiert zu 32bit Integer
  }
  return hash
}

/**
 * Wählt eine konsistente Farbe für eine gegebene Kategorie.
 * @param category Die Kategorie der Aufgabe.
 * @param fixedMappings Optionale feste Zuordnungen von Kategorien zu Farben.
 * @returns Ein Farbobjekt aus der Palette.
 */
export function getCategoryColor(category: string, fixedMappings: CategoryColorMapping[] = []) {
  if (!category) return COLORS[0]

  // Erst nach festen Zuordnungen suchen
  const fixedMapping = fixedMappings.find((mapping) => mapping.category === category)
  if (fixedMapping && fixedMapping.colorIndex >= 0 && fixedMapping.colorIndex < COLORS.length) {
    return COLORS[fixedMapping.colorIndex]
  }

  // Fallback auf Hash-basierte Zuordnung
  const hash = hashCode(category)
  const index = Math.abs(hash) % COLORS.length
  return COLORS[index]
}

/**
 * Gibt alle verfügbaren Farben zurück.
 * @returns Array aller verfügbaren Farben mit ihren Namen.
 */
export function getAvailableColors() {
  return COLORS
}
