import type { Application, Priority, Stage } from '../types'
import { daysBetween, isValidDate, today } from './dates'

export type DateRange = 'all' | '7' | '30' | '90'

export interface Filters {
  query: string
  stages: Stage[]
  priorities: Priority[]
  sources: string[]
  range: DateRange
}

export const EMPTY_FILTERS: Filters = { query: '', stages: [], priorities: [], sources: [], range: 'all' }

export function hasActiveFilters(f: Filters) {
  return f.query.trim() !== '' || f.stages.length > 0 || f.priorities.length > 0 || f.sources.length > 0 || f.range !== 'all'
}

/** Wishlist cards have no applied date, so fall back to when they were added. */
function referenceDate(app: Application) {
  return isValidDate(app.dateApplied) ? app.dateApplied : app.stageHistory[0]?.date
}

/** Every active filter must match (AND). Within one filter, any selected value matches (OR). */
export function applyFilters(apps: Application[], f: Filters, now = today()): Application[] {
  const q = f.query.trim().toLowerCase()
  return apps.filter((a) => {
    if (q && !a.company.toLowerCase().includes(q) && !a.role.toLowerCase().includes(q)) return false
    if (f.stages.length && !f.stages.includes(a.stage)) return false
    if (f.priorities.length && !f.priorities.includes(a.priority)) return false
    if (f.sources.length && !f.sources.includes(a.source)) return false
    if (f.range !== 'all') {
      const d = referenceDate(a)
      if (!isValidDate(d)) return false
      const age = daysBetween(d, now)
      if (age < 0 || age > Number(f.range)) return false
    }
    return true
  })
}
