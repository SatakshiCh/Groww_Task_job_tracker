import type { Application, Stage } from '../types'
import { FOLLOW_UP_DAYS, STAGES, STAGE_META, STALE_DAYS } from './constants'
import { daysBetween, isValidDate, today } from './dates'

// ---------- alerts ----------

export function stageEnteredOn(app: Application): string {
  return app.stageHistory[app.stageHistory.length - 1]?.date ?? app.dateApplied
}

export function daysInStage(app: Application, now = today()): number {
  const d = stageEnteredOn(app)
  return isValidDate(d) ? Math.max(0, daysBetween(d, now)) : 0
}

export interface AlertItem {
  app: Application
  detail: string
  days: number
}

export interface Alerts {
  followUp: AlertItem[]
  stale: AlertItem[]
  thisWeek: AlertItem[]
}

const ACTIVE: Stage[] = ['wishlist', 'applied', 'oa', 'interview']

export function computeAlerts(apps: Application[], now = today()): Alerts {
  const followUp: AlertItem[] = []
  const stale: AlertItem[] = []
  const thisWeek: AlertItem[] = []

  for (const app of apps) {
    if (app.stage === 'applied') {
      const days = daysInStage(app, now)
      if (days >= FOLLOW_UP_DAYS) followUp.push({ app, days, detail: `${days} days in Applied, no update` })
      if (days >= STALE_DAYS) stale.push({ app, days, detail: `No movement for ${days} days` })
    }
    if (app.upcoming && ACTIVE.includes(app.stage)) {
      const inDays = daysBetween(now, app.upcoming.date)
      if (inDays >= 0 && inDays <= 7) thisWeek.push({ app, days: inDays, detail: '' })
    }
  }

  followUp.sort((a, b) => b.days - a.days)
  stale.sort((a, b) => b.days - a.days)
  thisWeek.sort((a, b) => a.days - b.days)
  return { followUp, stale, thisWeek }
}

// ---------- analytics ----------

/** Anything past Wishlist counts as a real, submitted application. */
export function isSubmitted(app: Application) {
  return app.stage !== 'wishlist'
}

/** Got an OA, interview or offer at some point — even if it was later rejected. */
export function gotResponse(app: Application) {
  return app.stageHistory.some((e) => e.stage === 'oa' || e.stage === 'interview' || e.stage === 'offer')
}

export interface Stats {
  tracked: number
  submitted: number
  wishlist: number
  responded: number
  offers: number
  responseRate: number | null
  offerRate: number | null
  avgDaysInPipeline: number | null
}

export function computeStats(apps: Application[], now = today()): Stats {
  const submitted = apps.filter(isSubmitted)
  const responded = submitted.filter(gotResponse).length
  const offers = submitted.filter((a) => a.stage === 'offer').length

  // First entry → today for open applications; first entry → closing date for offers/rejections.
  const spans = submitted
    .map((a) => {
      const first = a.stageHistory[0]?.date
      if (!isValidDate(first)) return null
      const closed = a.stage === 'offer' || a.stage === 'rejected'
      const end = closed ? stageEnteredOn(a) : now
      return Math.max(0, daysBetween(first, end))
    })
    .filter((n): n is number => n !== null)

  return {
    tracked: apps.length,
    submitted: submitted.length,
    wishlist: apps.length - submitted.length,
    responded,
    offers,
    responseRate: submitted.length ? responded / submitted.length : null,
    offerRate: submitted.length ? offers / submitted.length : null,
    avgDaysInPipeline: spans.length ? spans.reduce((s, n) => s + n, 0) / spans.length : null,
  }
}

export interface TransitionStat {
  key: string
  label: string
  avg: number
  count: number
}

/** Average gap between consecutive stage changes, e.g. "Applied → OA: 5.5 days". */
export function computeTransitions(apps: Application[]): TransitionStat[] {
  const buckets = new Map<string, { from: Stage; to: Stage; total: number; count: number }>()
  for (const app of apps) {
    const h = app.stageHistory
    for (let i = 1; i < h.length; i++) {
      const from = h[i - 1].stage
      const to = h[i].stage
      if (from === to || from === 'wishlist') continue
      const key = `${from}>${to}`
      const b = buckets.get(key) ?? { from, to, total: 0, count: 0 }
      b.total += Math.max(0, daysBetween(h[i - 1].date, h[i].date))
      b.count += 1
      buckets.set(key, b)
    }
  }
  const order = (s: Stage) => STAGES.indexOf(s)
  return [...buckets.entries()]
    .sort(([, a], [, b]) => order(a.from) - order(b.from) || order(a.to) - order(b.to))
    .map(([key, b]) => ({
      key,
      label: `${STAGE_META[b.from].short} → ${STAGE_META[b.to].short}`,
      avg: Math.round((b.total / b.count) * 10) / 10,
      count: b.count,
    }))
}
