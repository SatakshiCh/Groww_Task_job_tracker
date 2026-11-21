import type { Application, Checklist, Priority, Settings, Stage, StageEvent, Upcoming } from '../types'
import { EMPTY_CHECKLIST, PRIORITIES, STAGES } from './constants'
import { isValidDate, today } from './dates'
import { newId } from './id'
import { DEFAULT_SETTINGS } from './seed'

const APPS_KEY = 'job-tracker:applications:v1'
const SETTINGS_KEY = 'job-tracker:settings:v2'
// v1 defaulted the name to "Sarthak"; v2 starts blank so the header reads "Job Tracker".
const LEGACY_SETTINGS_KEY = 'job-tracker:settings:v1'

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked (private mode in some browsers). The app keeps working in memory.
  }
}

export function loadApplications(): Application[] | null {
  const raw = read<unknown>(APPS_KEY)
  if (!Array.isArray(raw)) return null
  return raw.map((r, i) => normalizeApplication(r, i)).filter((a): a is Application => a !== null)
}

export function saveApplications(apps: Application[]) {
  write(APPS_KEY, apps)
}

export function loadSettings(): Settings | null {
  const raw = read<Partial<Settings>>(SETTINGS_KEY)
  if (raw && typeof raw === 'object') return normalizeSettings(raw)
  const legacy = read<Partial<Settings>>(LEGACY_SETTINGS_KEY)
  if (legacy && typeof legacy === 'object') return normalizeSettings({ ...legacy, name: '' })
  return null
}

export function saveSettings(settings: Settings) {
  write(SETTINGS_KEY, settings)
}

export function clearStorage() {
  try {
    localStorage.removeItem(APPS_KEY)
    localStorage.removeItem(SETTINGS_KEY)
    localStorage.removeItem(LEGACY_SETTINGS_KEY)
  } catch {
    /* ignore */
  }
}

// ---------- normalisation (shared by localStorage load and JSON import) ----------

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)
const isStage = (v: unknown): v is Stage => typeof v === 'string' && (STAGES as string[]).includes(v)

export function normalizeApplication(input: unknown, index = 0): Application | null {
  if (!input || typeof input !== 'object') return null
  const r = input as Record<string, unknown>
  const company = str(r.company).trim()
  const role = str(r.role).trim()
  if (!company && !role) return null

  const stage: Stage = isStage(r.stage) ? r.stage : 'applied'
  const priority: Priority = PRIORITIES.includes(r.priority as Priority) ? (r.priority as Priority) : 'medium'

  let history: StageEvent[] = Array.isArray(r.stageHistory)
    ? (r.stageHistory as unknown[])
        .map((e) => e as Record<string, unknown>)
        .filter((e) => e && isStage(e.stage) && isValidDate(e.date as string))
        .map((e) => ({ stage: e.stage as Stage, date: e.date as string }))
    : []
  if (history.length === 0) {
    const d = isValidDate(r.dateApplied as string) ? (r.dateApplied as string) : today()
    history = [{ stage, date: d }]
  }

  const checklistIn = (r.checklist ?? {}) as Partial<Checklist>
  const checklist = Object.fromEntries(
    Object.keys(EMPTY_CHECKLIST).map((k) => [k, Boolean(checklistIn[k as keyof Checklist])]),
  ) as unknown as Checklist

  let upcoming: Upcoming | null = null
  const up = r.upcoming as Record<string, unknown> | null | undefined
  if (up && isValidDate(up.date as string)) {
    const kind = up.kind === 'oa' || up.kind === 'interview' ? up.kind : 'other'
    upcoming = { kind, date: up.date as string }
  }

  const stamp = new Date().toISOString()
  return {
    id: str(r.id) || newId(),
    company: company || 'Untitled company',
    role: role || 'Untitled role',
    stage,
    dateApplied: isValidDate(r.dateApplied as string) ? (r.dateApplied as string) : '',
    priority,
    source: str(r.source, 'Other') || 'Other',
    resumeVersion: str(r.resumeVersion),
    salary: str(r.salary),
    applicationLink: str(r.applicationLink),
    notes: str(r.notes),
    checklist,
    stageHistory: history,
    upcoming,
    position: typeof r.position === 'number' && Number.isFinite(r.position) ? r.position : index + 1,
    createdAt: str(r.createdAt, stamp),
    updatedAt: str(r.updatedAt, stamp),
  }
}

export function normalizeSettings(raw: Partial<Settings>): Settings {
  const versions = Array.isArray(raw.resumeVersions)
    ? raw.resumeVersions.filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    : DEFAULT_SETTINGS.resumeVersions
  return {
    name: typeof raw.name === 'string' ? raw.name : DEFAULT_SETTINGS.name,
    resumeVersions: [...new Set(versions)],
  }
}

/** Accepts either our export shape `{ applications, settings }` or a bare array of applications. */
export function parseImport(text: string): { applications: Application[]; settings: Settings | null } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That file isn't valid JSON.")
  }
  const list = Array.isArray(data) ? data : (data as { applications?: unknown })?.applications
  if (!Array.isArray(list)) throw new Error('No applications found in that file.')
  const applications = list.map((r, i) => normalizeApplication(r, i)).filter((a): a is Application => a !== null)
  if (list.length > 0 && applications.length === 0) throw new Error("Couldn't read any applications from that file.")
  const s = !Array.isArray(data) ? (data as { settings?: Partial<Settings> }).settings : undefined
  return { applications, settings: s && typeof s === 'object' ? normalizeSettings(s) : null }
}
