import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { Application, Settings, Stage } from '../types'
import { buildSeed, DEFAULT_SETTINGS } from '../lib/seed'
import { loadApplications, loadSettings, saveApplications, saveSettings } from '../lib/storage'
import { today } from '../lib/dates'
import { newId } from '../lib/id'
import { EMPTY_CHECKLIST } from '../lib/constants'

interface State {
  applications: Application[]
  settings: Settings
}

type Action =
  | { type: 'add'; app: Application }
  | { type: 'update'; id: string; patch: Partial<Application> }
  | { type: 'move'; id: string; stage: Stage; position?: number }
  | { type: 'remove'; id: string }
  | { type: 'replace'; applications: Application[]; settings?: Settings }
  | { type: 'settings'; patch: Partial<Settings> }

function reducer(state: State, action: Action): State {
  const stamp = new Date().toISOString()
  switch (action.type) {
    case 'add':
      return { ...state, applications: [...state.applications, action.app] }

    case 'update':
      return {
        ...state,
        applications: state.applications.map((a) => (a.id === action.id ? { ...a, ...action.patch, updatedAt: stamp } : a)),
      }

    case 'move':
      return {
        ...state,
        applications: state.applications.map((a) => {
          if (a.id !== action.id) return a
          const position = action.position ?? a.position
          if (a.stage === action.stage) return position === a.position ? a : { ...a, position, updatedAt: stamp }
          const date = today()
          return {
            ...a,
            stage: action.stage,
            position,
            // Leaving the wishlist means you applied, so the applied date can be filled in for you.
            dateApplied: a.dateApplied || (a.stage === 'wishlist' && action.stage !== 'rejected' ? date : a.dateApplied),
            stageHistory: [...a.stageHistory, { stage: action.stage, date }],
            updatedAt: stamp,
          }
        }),
      }

    case 'remove':
      return { ...state, applications: state.applications.filter((a) => a.id !== action.id) }

    case 'replace':
      return { applications: action.applications, settings: action.settings ?? state.settings }

    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
  }
}

function init(): State {
  return {
    applications: loadApplications() ?? buildSeed(),
    settings: loadSettings() ?? DEFAULT_SETTINGS,
  }
}

export interface NewApplication {
  company: string
  role: string
  applicationLink: string
  resumeVersion: string
  dateApplied: string
  priority: Application['priority']
  stage: Stage
  salary: string
  source: string
}

interface Store extends State {
  addApplication: (input: NewApplication) => Application
  updateApplication: (id: string, patch: Partial<Application>) => void
  moveApplication: (id: string, stage: Stage, position?: number) => void
  deleteApplication: (id: string) => void
  replaceAll: (applications: Application[], settings?: Settings) => void
  updateSettings: (patch: Partial<Settings>) => void
  resetToSeed: () => void
}

const StoreContext = createContext<Store | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  useEffect(() => saveApplications(state.applications), [state.applications])
  useEffect(() => saveSettings(state.settings), [state.settings])

  const addApplication = useCallback(
    (input: NewApplication) => {
      const stamp = new Date().toISOString()
      const now = today()
      const applied = input.stage === 'wishlist' ? '' : input.dateApplied || now

      // History starts on the day you applied, so back-dated entries still trigger follow-ups correctly.
      const history =
        input.stage === 'wishlist'
          ? [{ stage: 'wishlist' as Stage, date: now }]
          : input.stage === 'applied'
            ? [{ stage: 'applied' as Stage, date: applied }]
            : [
                { stage: 'applied' as Stage, date: applied },
                { stage: input.stage, date: now < applied ? applied : now },
              ]

      const inColumn = state.applications.filter((a) => a.stage === input.stage)
      const top = inColumn.length ? Math.min(...inColumn.map((a) => a.position)) - 1 : 1

      const app: Application = {
        id: newId(),
        company: input.company.trim(),
        role: input.role.trim(),
        stage: input.stage,
        dateApplied: applied,
        priority: input.priority,
        source: input.source,
        resumeVersion: input.resumeVersion,
        salary: input.salary.trim(),
        applicationLink: input.applicationLink.trim(),
        notes: '',
        checklist: { ...EMPTY_CHECKLIST },
        stageHistory: history,
        upcoming: null,
        position: top,
        createdAt: stamp,
        updatedAt: stamp,
      }
      dispatch({ type: 'add', app })
      return app
    },
    [state.applications],
  )

  const value = useMemo<Store>(
    () => ({
      ...state,
      addApplication,
      updateApplication: (id, patch) => dispatch({ type: 'update', id, patch }),
      moveApplication: (id, stage, position) => dispatch({ type: 'move', id, stage, position }),
      deleteApplication: (id) => dispatch({ type: 'remove', id }),
      replaceAll: (applications, settings) => dispatch({ type: 'replace', applications, settings }),
      updateSettings: (patch) => dispatch({ type: 'settings', patch }),
      resetToSeed: () => dispatch({ type: 'replace', applications: buildSeed(), settings: { ...DEFAULT_SETTINGS } }),
    }),
    [state, addApplication],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider')
  return ctx
}
