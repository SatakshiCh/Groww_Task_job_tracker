import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ExternalLink, Trash2, X } from 'lucide-react'
import type { Application, Checklist, Priority, Stage, UpcomingKind } from '../types'
import { useStore } from '../store/AppStore'
import { useUi } from '../store/UiStore'
import { useBodyLock, useEscape, ConfirmDialog } from './Modal'
import { CompanyAvatar } from './bits'
import { normalizeUrl } from './QuickAddModal'
import { CHECKLIST_ITEMS, PRIORITIES, PRIORITY_META, SOURCES, STAGES, STAGE_META, UPCOMING_LABEL } from '../lib/constants'
import { daysBetween, formatDate, formatLong, plural, today } from '../lib/dates'

export default function DetailDrawer() {
  const { openAppId, closeApp } = useUi()
  const { applications } = useStore()
  const app = applications.find((a) => a.id === openAppId)

  useEffect(() => {
    if (openAppId && !app) closeApp()
  }, [openAppId, app, closeApp])

  useBodyLock(!!app)
  if (!app) return null
  // Keyed so local drafts reset when switching between applications.
  return <DrawerBody key={app.id} app={app} onClose={closeApp} />
}

function DrawerBody({ app, onClose }: { app: Application; onClose: () => void }) {
  const { updateApplication, moveApplication, deleteApplication, settings } = useStore()
  const { toast } = useUi()
  const [confirming, setConfirming] = useState(false)
  useEscape(!confirming, onClose)

  const update = (patch: Partial<Application>) => updateApplication(app.id, patch)

  const changeStage = (stage: Stage) => {
    if (stage === app.stage) return
    moveApplication(app.id, stage)
    toast(`Moved to ${STAGE_META[stage].short}`)
  }

  const remove = () => {
    deleteApplication(app.id)
    setConfirming(false)
    onClose()
    toast(`${app.company} deleted`, 'danger')
  }

  const resumeOptions = app.resumeVersion && !settings.resumeVersions.includes(app.resumeVersion)
    ? [...settings.resumeVersions, app.resumeVersion]
    : settings.resumeVersions

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${app.company} details`}>
      <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full animate-slide-in flex-col border-l border-ink-800 bg-ink-900 shadow-lift sm:w-[480px]">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-ink-800 px-4 pb-4 pt-4 sm:px-5">
          <CompanyAvatar name={app.company} size="lg" />
          <div className="min-w-0 flex-1 -ml-1">
            <RequiredText
              value={app.company}
              onCommit={(v) => update({ company: v })}
              className="field-inline py-0.5 text-lg font-semibold"
              label="Company"
            />
            <RequiredText
              value={app.role}
              onCommit={(v) => update({ role: v })}
              className="field-inline py-0.5 text-sm text-zinc-400"
              label="Role"
            />
          </div>
          <button type="button" onClick={onClose} className="btn-ghost -mr-1 h-8 w-8 shrink-0 p-0" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin sm:px-5">
          {/* Stage + priority, the two things you change most */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="d-stage" className="label">Stage</label>
              <div className="relative">
                <span className={`pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${STAGE_META[app.stage].dot}`} />
                <select id="d-stage" className="field pl-7" value={app.stage} onChange={(e) => changeStage(e.target.value as Stage)}>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <span className="label">Priority</span>
              <div className="grid grid-cols-3 gap-0.5 rounded-md border border-ink-700 bg-ink-950 p-0.5" role="radiogroup" aria-label="Priority">
                {PRIORITIES.map((p: Priority) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={app.priority === p}
                    title={PRIORITY_META[p].label}
                    onClick={() => update({ priority: p })}
                    className={`flex h-[30px] items-center justify-center gap-1.5 rounded text-xs transition-colors ${
                      app.priority === p ? 'bg-ink-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${PRIORITY_META[p].dot}`} />
                    <span className="hidden min-[400px]:inline">{PRIORITY_META[p].label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Details */}
          <Section title="Details">
            <dl className="divide-y divide-ink-800/70">
              <Row label="Date applied">
                <input
                  type="date"
                  className="field-inline"
                  value={app.dateApplied}
                  max={today()}
                  onChange={(e) => update({ dateApplied: e.target.value })}
                />
              </Row>
              <Row label="Source">
                <select className="field-inline" value={app.source} onChange={(e) => update({ source: e.target.value })}>
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                  {!SOURCES.some((s) => s.value === app.source) && <option value={app.source}>{app.source}</option>}
                </select>
              </Row>
              <Row label="Resume">
                <select className="field-inline" value={app.resumeVersion} onChange={(e) => update({ resumeVersion: e.target.value })}>
                  {resumeOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                  <option value="">None</option>
                </select>
              </Row>
              <Row label="Salary / stipend">
                <input
                  className="field-inline"
                  value={app.salary}
                  placeholder="Add amount"
                  onChange={(e) => update({ salary: e.target.value })}
                />
              </Row>
              <Row label="Job link">
                <div className="flex items-center gap-1">
                  <input
                    className="field-inline min-w-0"
                    inputMode="url"
                    value={app.applicationLink}
                    placeholder="Paste the posting URL"
                    onChange={(e) => update({ applicationLink: e.target.value })}
                    onBlur={(e) => update({ applicationLink: normalizeUrl(e.target.value) })}
                  />
                  {app.applicationLink && (
                    <a
                      href={normalizeUrl(app.applicationLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost h-8 w-8 shrink-0 p-0 text-brand-400"
                      title="Open posting in a new tab"
                      aria-label="Open job posting in a new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </Row>
              <Row label="Next date">
                <UpcomingEditor app={app} onChange={(upcoming) => update({ upcoming })} />
              </Row>
            </dl>
          </Section>

          <Section title="Stage timeline">
            <Timeline app={app} />
          </Section>

          <Section
            title="Prep checklist"
            aside={
              <span className="tabular text-xs text-zinc-500">
                {Object.values(app.checklist).filter(Boolean).length}/{CHECKLIST_ITEMS.length}
              </span>
            }
          >
            <ChecklistEditor checklist={app.checklist} onChange={(checklist) => update({ checklist })} />
          </Section>

          <Section title="Notes" aside={<NotesSavedHint updatedAt={app.updatedAt} />}>
            <textarea
              className="field min-h-[160px] resize-y leading-relaxed"
              value={app.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder={'Recruiter name and email, referral details, what they asked in the last round, how it went…'}
            />
          </Section>

          <div className="mt-8 flex items-center justify-between border-t border-ink-800 pt-4 text-xs text-zinc-500">
            <span>Added {formatDate(app.createdAt.slice(0, 10), { year: 'always' })}</span>
            <button type="button" onClick={() => setConfirming(true)} className="btn h-8 px-3 text-rose-400 hover:bg-rose-500/10">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={confirming}
        title="Delete application?"
        message={
          <>
            Are you sure you want to delete this application? <span className="text-zinc-200">{app.company} · {app.role}</span>, its notes and
            timeline will be removed. This can't be undone.
          </>
        }
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2 py-1">
      <dt className="text-[13px] text-zinc-500">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

/** Edits a required text field; an empty value snaps back to the last saved one on blur. */
function RequiredText({
  value,
  onCommit,
  className,
  label,
}: {
  value: string
  onCommit: (v: string) => void
  className: string
  label: string
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const commit = () => {
    const v = draft.trim()
    if (!v) setDraft(value)
    else if (v !== value) onCommit(v)
  }
  return (
    <input
      aria-label={label}
      className={className}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
    />
  )
}

function UpcomingEditor({ app, onChange }: { app: Application; onChange: (u: Application['upcoming']) => void }) {
  const kind: UpcomingKind = app.upcoming?.kind ?? (app.stage === 'interview' ? 'interview' : 'oa')
  return (
    <div className="flex items-center gap-1">
      <select
        className="field-inline w-auto shrink-0 pr-1"
        value={kind}
        aria-label="What is coming up"
        onChange={(e) => app.upcoming && onChange({ ...app.upcoming, kind: e.target.value as UpcomingKind })}
      >
        {(Object.keys(UPCOMING_LABEL) as UpcomingKind[]).map((k) => (
          <option key={k} value={k}>
            {UPCOMING_LABEL[k]}
          </option>
        ))}
      </select>
      <input
        type="date"
        className="field-inline min-w-0"
        aria-label="Date"
        value={app.upcoming?.date ?? ''}
        onChange={(e) => onChange(e.target.value ? { kind, date: e.target.value } : null)}
      />
      {app.upcoming && (
        <button type="button" className="btn-ghost h-7 w-7 shrink-0 p-0 text-zinc-500" onClick={() => onChange(null)} aria-label="Clear date">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function Timeline({ app }: { app: Application }) {
  const h = app.stageHistory
  const now = today()
  return (
    <ol className="relative ml-1">
      {h.map((e, i) => {
        const last = i === h.length - 1
        const gap = i > 0 ? daysBetween(h[i - 1].date, e.date) : null
        return (
          <li key={`${e.stage}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
            {!last && <span className="absolute left-[5px] top-3 h-full w-px bg-ink-700" aria-hidden />}
            <span
              className={`relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-ink-900 ${STAGE_META[e.stage].dot} ${
                last ? 'ring-2 ring-offset-0 ring-white/10' : ''
              }`}
            />
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
              <span className={`text-sm font-medium ${last ? 'text-zinc-100' : 'text-zinc-300'}`}>{STAGE_META[e.stage].label}</span>
              <span className="tabular text-xs text-zinc-500">{formatLong(e.date)}</span>
              {gap !== null && gap > 0 && <span className="tabular text-xs text-zinc-600">+{plural(gap, 'day')}</span>}
              {last && app.stage !== 'offer' && app.stage !== 'rejected' && (
                <span className="tabular w-full text-xs text-zinc-500">
                  {daysBetween(e.date, now) === 0 ? 'Entered today' : `In this stage for ${plural(daysBetween(e.date, now), 'day')}`}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function ChecklistEditor({ checklist, onChange }: { checklist: Checklist; onChange: (c: Checklist) => void }) {
  const done = Object.values(checklist).filter(Boolean).length
  return (
    <div>
      <div className="mb-2 h-1 overflow-hidden rounded-full bg-ink-800">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(done / CHECKLIST_ITEMS.length) * 100}%` }} />
      </div>
      <ul className="space-y-0.5">
        {CHECKLIST_ITEMS.map(({ key, label }) => {
          const checked = checklist[key]
          return (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-ink-850">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={checked}
                  onChange={() => onChange({ ...checklist, [key]: !checked })}
                />
                <span
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/50 ${
                    checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-600'
                  }`}
                >
                  {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className={`text-sm ${checked ? 'text-zinc-500 line-through decoration-zinc-600' : 'text-zinc-200'}`}>{label}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function NotesSavedHint({ updatedAt }: { updatedAt: string }) {
  const [show, setShow] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setShow(true)
    const t = window.setTimeout(() => setShow(false), 1400)
    return () => window.clearTimeout(t)
  }, [updatedAt])
  return (
    <span className={`flex items-center gap-1 text-xs transition-opacity ${show ? 'text-brand-400 opacity-100' : 'text-zinc-600 opacity-100'}`}>
      {show ? (
        <>
          <Check className="h-3 w-3" /> Saved
        </>
      ) : (
        'Saves as you type'
      )}
    </span>
  )
}

