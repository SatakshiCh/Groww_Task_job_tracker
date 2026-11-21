// All dates in the app are plain local calendar dates (YYYY-MM-DD). Keeping them as strings
// avoids the classic off-by-one when a UTC timestamp crosses midnight in IST.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function today(): string {
  return toISODate(new Date())
}

function parts(iso: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return null
  return [Number(m[1]), Number(m[2]) - 1, Number(m[3])]
}

export function isValidDate(iso: string | undefined | null): iso is string {
  return !!iso && parts(iso) !== null
}

function utc(iso: string): number {
  const p = parts(iso)
  if (!p) return NaN
  return Date.UTC(p[0], p[1], p[2])
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((utc(b) - utc(a)) / 86_400_000)
}

export function addDays(iso: string, days: number): string {
  const p = parts(iso)
  if (!p) return iso
  const d = new Date(p[0], p[1], p[2] + days)
  return toISODate(d)
}

/** "5 Nov" this year, "5 Nov 2024" otherwise. */
export function formatDate(iso: string, opts: { year?: 'auto' | 'always' } = {}): string {
  const p = parts(iso)
  if (!p) return '—'
  const showYear = opts.year === 'always' || p[0] !== new Date().getFullYear()
  return `${p[2]} ${MONTHS[p[1]]}${showYear ? ` ${p[0]}` : ''}`
}

export function formatLong(iso: string): string {
  const p = parts(iso)
  if (!p) return '—'
  const d = new Date(p[0], p[1], p[2])
  return `${WEEKDAYS[d.getDay()]}, ${p[2]} ${MONTHS[p[1]]} ${p[0]}`
}

/** "today", "tomorrow", "in 3 days", "yesterday", "4 days ago" */
export function relativeDay(iso: string, from = today()): string {
  const diff = daysBetween(from, iso)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  if (diff > 1) return `in ${diff} days`
  return `${-diff} days ago`
}

export function plural(n: number, word: string, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`
}
