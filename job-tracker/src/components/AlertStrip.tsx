import { useMemo, useState } from 'react'
import { BellRing, CalendarClock, ChevronDown, ChevronRight, Hourglass } from 'lucide-react'
import type { Application } from '../types'
import { computeAlerts, type AlertItem } from '../lib/insights'
import { formatDate, plural, relativeDay } from '../lib/dates'
import { UPCOMING_LABEL } from '../lib/constants'
import { useUi } from '../store/UiStore'
import { CompanyAvatar } from './bits'

type Key = 'followUp' | 'thisWeek' | 'stale'

const TONES: Record<Key, { on: string; off: string; icon: string }> = {
  followUp: {
    on: 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15',
    off: 'border-amber-500/40 bg-amber-500/15 text-amber-100',
    icon: 'text-amber-300',
  },
  thisWeek: {
    on: 'border-sky-500/40 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15',
    off: 'border-sky-500/40 bg-sky-500/15 text-sky-100',
    icon: 'text-sky-300',
  },
  stale: {
    on: 'border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15',
    off: 'border-rose-500/40 bg-rose-500/15 text-rose-100',
    icon: 'text-rose-300',
  },
}

export default function AlertStrip({ apps }: { apps: Application[] }) {
  const alerts = useMemo(() => computeAlerts(apps), [apps])
  const [open, setOpen] = useState<Key | null>(null)
  const { openApp } = useUi()

  const first = alerts.thisWeek[0]
  const pills: { key: Key; icon: typeof BellRing; label: string; items: AlertItem[] }[] = [
    {
      key: 'followUp',
      icon: BellRing,
      label: `${alerts.followUp.length} need${alerts.followUp.length === 1 ? 's' : ''} follow-up`,
      items: alerts.followUp,
    },
    {
      key: 'thisWeek',
      icon: CalendarClock,
      label:
        alerts.thisWeek.length === 1 && first.app.upcoming
          ? `${UPCOMING_LABEL[first.app.upcoming.kind]} ${relativeDay(first.app.upcoming.date)}`
          : `${alerts.thisWeek.length} this week`,
      items: alerts.thisWeek,
    },
    { key: 'stale', icon: Hourglass, label: `${alerts.stale.length} stale`, items: alerts.stale },
  ]

  const total = alerts.followUp.length + alerts.thisWeek.length + alerts.stale.length
  const current = pills.find((p) => p.key === open)

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 hidden text-xs font-medium uppercase sm:inline tracking-wider text-zinc-500">Needs attention</span>
        {pills.map(({ key, icon: Icon, label, items }) => {
          const empty = items.length === 0
          const active = open === key
          return (
            <button
              key={key}
              type="button"
              disabled={empty}
              aria-expanded={active}
              onClick={() => setOpen(active ? null : key)}
              className={`tabular inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
                empty ? 'cursor-default border-ink-800 text-zinc-500' : active ? TONES[key].off : TONES[key].on
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${empty ? '' : TONES[key].icon}`} />
              {label}
              {!empty && <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${active ? 'rotate-180' : ''}`} />}
            </button>
          )
        })}
        {total === 0 && <span className="text-[13px] text-zinc-500">Nothing pending. Nice.</span>}
      </div>

      {current && current.items.length > 0 && (
        <ul className="panel mt-2 animate-pop-in divide-y divide-ink-800 overflow-hidden">
          {current.items.map(({ app, detail }) => (
            <li key={app.id}>
              <button
                type="button"
                onClick={() => openApp(app.id)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-ink-850"
              >
                <CompanyAvatar name={app.company} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-100">{app.company}</div>
                  <div className="truncate text-xs text-zinc-400">{app.role}</div>
                  <div className="tabular mt-0.5 truncate text-xs text-zinc-500 sm:hidden">
                    {current.key === 'thisWeek' && app.upcoming
                      ? `${UPCOMING_LABEL[app.upcoming.kind]} ${relativeDay(app.upcoming.date)}`
                      : detail}
                  </div>
                </div>
                <span className="tabular hidden text-right text-xs text-zinc-400 sm:block">
                  {current.key === 'thisWeek' && app.upcoming
                    ? `${UPCOMING_LABEL[app.upcoming.kind]} · ${formatDate(app.upcoming.date)} (${relativeDay(app.upcoming.date)})`
                    : detail}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
              </button>
            </li>
          ))}
          {current.key === 'followUp' && (
            <li className="px-3 py-2 text-xs text-zinc-500">
              Flagged after 7 days in Applied with no stage change. A short note to the recruiter or your referrer usually helps.
            </li>
          )}
          {current.key === 'stale' && (
            <li className="px-3 py-2 text-xs text-zinc-500">
              {plural(current.items.length, 'application')} with no movement for 14+ days. Follow up once more, or move to Rejected to keep the board honest.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
