export const MARQUEE_THEMES = [
  { id: 'fine-dining', label: 'Fine Dining' },
  { id: 'specialty-coffee', label: 'Specialty Coffee' },
  { id: 'design-hotels', label: 'Design Hotels' },
  { id: 'hanok-stays', label: 'Hanok Stays' },
  { id: 'hidden-bars', label: 'Hidden Bars' },
  { id: 'concept-stores', label: 'Concept Stores' },
  { id: 'cultural-spaces', label: 'Cultural Spaces' },
  { id: 'wellness-spas', label: 'Wellness & Spas' },
  { id: 'night-markets', label: 'Night Markets' },
  { id: 'rooftop-views', label: 'Rooftop Views' },
] as const

export type MarqueeThemeId = (typeof MARQUEE_THEMES)[number]['id']

const THEME_IDS = new Set<string>(MARQUEE_THEMES.map((t) => t.id))

export function parseMarqueeTheme(value: string | null): MarqueeThemeId | null {
  if (!value || !THEME_IDS.has(value)) return null
  return value as MarqueeThemeId
}

export function labelForMarqueeTheme(id: MarqueeThemeId): string {
  return MARQUEE_THEMES.find((t) => t.id === id)?.label ?? id
}

export function filterGuidesByTheme<
  T extends { themeTags?: readonly MarqueeThemeId[] },
>(guides: readonly T[], theme: MarqueeThemeId | null): T[] {
  if (!theme) return [...guides]
  return guides.filter((g) => g.themeTags?.includes(theme)) as T[]
}
