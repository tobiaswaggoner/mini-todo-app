// Color palette for categories, sorted by color wheel
export const COLORS = [
  {
    bg: "bg-red-200",
    border: "border-red-500",
    text: "text-red-800",
    darkBg: "dark:bg-red-900",
    darkBorder: "dark:border-red-500",
    darkText: "dark:text-red-100",
    nameKey: "red",
  },
  {
    bg: "bg-orange-200",
    border: "border-orange-500",
    text: "text-orange-800",
    darkBg: "dark:bg-orange-900",
    darkBorder: "dark:border-orange-500",
    darkText: "dark:text-orange-100",
    nameKey: "orange",
  },
  {
    bg: "bg-yellow-200",
    border: "border-yellow-500",
    text: "text-yellow-800",
    darkBg: "dark:bg-yellow-900",
    darkBorder: "dark:border-yellow-500",
    darkText: "dark:text-yellow-100",
    nameKey: "yellow",
  },
  {
    bg: "bg-lime-200",
    border: "border-lime-500",
    text: "text-lime-800",
    darkBg: "dark:bg-lime-900",
    darkBorder: "dark:border-lime-500",
    darkText: "dark:text-lime-100",
    nameKey: "lime",
  },
  {
    bg: "bg-green-200",
    border: "border-green-500",
    text: "text-green-800",
    darkBg: "dark:bg-green-900",
    darkBorder: "dark:border-green-500",
    darkText: "dark:text-green-100",
    nameKey: "green",
  },
  {
    bg: "bg-teal-200",
    border: "border-teal-500",
    text: "text-teal-800",
    darkBg: "dark:bg-teal-900",
    darkBorder: "dark:border-teal-500",
    darkText: "dark:text-teal-100",
    nameKey: "teal",
  },
  {
    bg: "bg-sky-200",
    border: "border-sky-500",
    text: "text-sky-800",
    darkBg: "dark:bg-sky-900",
    darkBorder: "dark:border-sky-500",
    darkText: "dark:text-sky-100",
    nameKey: "sky",
  },
  {
    bg: "bg-indigo-200",
    border: "border-indigo-500",
    text: "text-indigo-800",
    darkBg: "dark:bg-indigo-900",
    darkBorder: "dark:border-indigo-500",
    darkText: "dark:text-indigo-100",
    nameKey: "indigo",
  },
  {
    bg: "bg-violet-200",
    border: "border-violet-500",
    text: "text-violet-800",
    darkBg: "dark:bg-violet-900",
    darkBorder: "dark:border-violet-500",
    darkText: "dark:text-violet-100",
    nameKey: "violet",
  },
  {
    bg: "bg-fuchsia-200",
    border: "border-fuchsia-500",
    text: "text-fuchsia-800",
    darkBg: "dark:bg-fuchsia-900",
    darkBorder: "dark:border-fuchsia-500",
    darkText: "dark:text-fuchsia-100",
    nameKey: "fuchsia",
  },
  {
    bg: "bg-rose-200",
    border: "border-rose-500",
    text: "text-rose-800",
    darkBg: "dark:bg-rose-900",
    darkBorder: "dark:border-rose-500",
    darkText: "dark:text-rose-100",
    nameKey: "rose",
  },
  {
    bg: "bg-slate-200",
    border: "border-slate-500",
    text: "text-slate-800",
    darkBg: "dark:bg-slate-900",
    darkBorder: "dark:border-slate-500",
    darkText: "dark:text-slate-100",
    nameKey: "slate",
  },
]

// Helper to get translated color name
export function getColorName(colorIndex: number, t: (key: string) => string): string {
  const color = COLORS[colorIndex]
  return color ? t(`colors.${color.nameKey}`) : ''
}

export interface CategoryColorMapping {
  category: string
  colorIndex: number
}

/**
 * Creates a simple hash code for a string.
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash
}

/**
 * Gets a consistent color for a given category.
 */
export function getCategoryColor(category: string, fixedMappings: CategoryColorMapping[] = []) {
  if (!category) return COLORS[0]

  // Check for fixed mappings first
  const fixedMapping = fixedMappings.find((mapping) => mapping.category === category)
  if (fixedMapping && fixedMapping.colorIndex >= 0 && fixedMapping.colorIndex < COLORS.length) {
    return COLORS[fixedMapping.colorIndex]
  }

  // Fallback to hash-based assignment
  const hash = hashCode(category)
  const index = Math.abs(hash) % COLORS.length
  return COLORS[index]
}

/**
 * Returns all available colors.
 */
export function getAvailableColors() {
  return COLORS
}
