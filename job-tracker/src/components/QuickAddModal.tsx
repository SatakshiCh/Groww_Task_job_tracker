import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { Priority, Stage } from '../types'
import Modal from './Modal'
import { useStore, type NewApplication } from '../store/AppStore'
import { useUi } from '../store/UiStore'
import { PRIORITIES, PRIORITY_META, SOURCES, STAGES, STAGE_META } from '../lib/constants'
import { today } from '../lib/dates'

export function normalizeUrl(raw: string) {
  const v = raw.trim()
  if (!v) return ''
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

function blank(resumeVersions: string[]): NewApplication {
  return {
    company: '',
    role: '',
    applicationLink: '',
    resumeVersion: resumeVersions.includes('General') ? 'General' : (resumeVersions[0] ?? ''),
    dateApplied: today(),
    priority: 'medium',
    stage: 'applied',
    salary: '',
    source: 'Other',
  }
}

export default function QuickAddModal() {
  const { quickAddOpen, setQuickAddOpen, toast } = useUi()
  const { addApplication, settings, applications } = useStore()
  const [form, setForm] = useState<NewApplication>(() => blank(settings.resumeVersions))
  const [tried, setTried] = useState(false)
  const companyRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (quickAddOpen) {
      setForm(blank(settings.resumeVersions))
      setTried(false)
      // Wait a frame so the input exists before focusing it.
      requestAnimationFrame(() => companyRef.current?.focus())
    }
  }, [quickAddOpen])

  const knownCompanies = useMemo(() => [...new Set(applications.map((a) => a.company))].sort(), [applications])
  const knownRoles = useMemo(() => [...new Set(applications.map((a) => a.role))].sort(), [applications])

  const set = <K extends keyof NewApplication>(key: K, value: NewApplication[K]) => setForm((f) => ({ ...f, [key]: value }))
  const close = () => setQuickAddOpen(false)

  const companyMissing = !form.company.trim()
  const roleMissing = !form.role.trim()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (companyMissing || roleMissing) {
      ;(companyMissing ? companyRef.current : document.getElementById('qa-role'))?.focus()
      return
    }
    const app = addApplication({ ...form, applicationLink: normalizeUrl(form.applicationLink) })
    toast(`${app.company} added to ${STAGE_META[app.stage].short}`)
    close()
  }

  return (
    <Modal open={quickAddOpen} onClose={close} title="Add application">
      <form onSubmit={submit} noValidate className="space-y-4 px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="qa-company" className="label">
              Company <span className="text-rose-400">*</span>
            </label>
            <input
              id="qa-company"
              ref={companyRef}
              className={`field ${tried && companyMissing ? 'border-rose-500/60' : ''}`}
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder="e.g. Zerodha"
              list="qa-companies"
              autoComplete="off"
            />
            {tried && companyMissing && <p className="mt-1 text-xs text-rose-400">Company is required</p>}
          </div>
          <div>
            <label htmlFor="qa-role" className="label">
              Role <span className="text-rose-400">*</span>
            </label>
            <input
              id="qa-role"
              className={`field ${tried && roleMissing ? 'border-rose-500/60' : ''}`}
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              placeholder="e.g. SDE Intern"
              list="qa-roles"
              autoComplete="off"
            />
            {tried && roleMissing && <p className="mt-1 text-xs text-rose-400">Role is required</p>}
          </div>
        </div>

        <div>
          <span className="label">Priority</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-ink-700 bg-ink-950 p-1" role="radiogroup" aria-label="Priority">
            {PRIORITIES.map((p: Priority) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={form.priority === p}
                onClick={() => set('priority', p)}
                className={`flex items-center justify-center gap-2 rounded-md py-1.5 text-sm transition-colors ${
                  form.priority === p ? 'bg-ink-800 text-zinc-100 shadow-card' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${PRIORITY_META[p].dot}`} />
                {PRIORITY_META[p].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="qa-stage" className="label">Stage</label>
            <select id="qa-stage" className="field" value={form.stage} onChange={(e) => set('stage', e.target.value as Stage)}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_META[s].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qa-date" className="label">Date applied</label>
            <input
              id="qa-date"
              type="date"
              className="field disabled:opacity-40"
              value={form.stage === 'wishlist' ? '' : form.dateApplied}
              max={today()}
              disabled={form.stage === 'wishlist'}
              onChange={(e) => set('dateApplied', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="qa-source" className="label">Source</label>
            <select id="qa-source" className="field" value={form.source} onChange={(e) => set('source', e.target.value)}>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qa-resume" className="label">Resume version</label>
            <select id="qa-resume" className="field" value={form.resumeVersion} onChange={(e) => set('resumeVersion', e.target.value)}>
              {settings.resumeVersions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
              <option value="">None</option>
            </select>
          </div>
          <div>
            <label htmlFor="qa-salary" className="label">Salary / stipend</label>
            <input
              id="qa-salary"
              className="field"
              value={form.salary}
              onChange={(e) => set('salary', e.target.value)}
              placeholder="₹40k/month"
            />
          </div>
          <div>
            <label htmlFor="qa-link" className="label">Job link</label>
            <input
              id="qa-link"
              className="field"
              inputMode="url"
              value={form.applicationLink}
              onChange={(e) => set('applicationLink', e.target.value)}
              placeholder="careers.company.com/…"
            />
          </div>
        </div>

        <datalist id="qa-companies">
          {knownCompanies.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <datalist id="qa-roles">
          {knownRoles.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>

        <div className="flex items-center justify-between gap-3 border-t border-ink-800 pt-4">
          <span className="hidden text-xs text-zinc-500 sm:block">
            Only company and role are required. <kbd className="rounded border border-ink-700 px-1 font-sans">Enter</kbd> to save.
          </span>
          <div className="ml-auto flex gap-2">
            <button type="button" className="btn-ghost" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add application
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
