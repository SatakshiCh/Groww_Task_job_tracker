import { forwardRef, type HTMLAttributes } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarClock, ListChecks } from 'lucide-react'
import type { Application } from '../types'
import { CompanyAvatar, PriorityDot } from './bits'
import { daysBetween, formatDate, relativeDay, today } from '../lib/dates'
import { FOLLOW_UP_DAYS, STALE_DAYS, UPCOMING_LABEL } from '../lib/constants'
import { daysInStage } from '../lib/insights'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  app: Application
  dragging?: boolean
  overlay?: boolean
}

export const AppCard = forwardRef<HTMLDivElement, CardProps>(function AppCard(
  { app, dragging, overlay, className = '', ...rest },
  ref,
) {
  const done = Object.values(app.checklist).filter(Boolean).length
  const waiting = app.stage === 'applied' ? daysInStage(app) : 0
  const upcomingIn = app.upcoming ? daysBetween(today(), app.upcoming.date) : null
  const showUpcoming =
    app.upcoming && upcomingIn !== null && upcomingIn >= 0 && upcomingIn <= 14 && app.stage !== 'offer' && app.stage !== 'rejected'

  return (
    <div
      ref={ref}
      {...rest}
      className={`group relative select-none rounded-lg border bg-ink-850 p-3 text-left shadow-card outline-none transition-[border-color,background-color,opacity] focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
        overlay
          ? 'rotate-[1.5deg] cursor-grabbing border-ink-600 bg-ink-800 shadow-lift'
          : 'cursor-pointer border-ink-800 hover:border-ink-600 hover:bg-ink-800'
      } ${dragging ? 'opacity-30' : ''} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <CompanyAvatar name={app.company} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-zinc-100">{app.company}</h3>
            <PriorityDot priority={app.priority} className="ml-auto" />
          </div>
          <p className="mt-0.5 truncate text-[13px] text-zinc-400">{app.role}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
        <span className="tabular truncate" title={app.dateApplied ? 'Date applied' : 'Added to wishlist'}>
          {app.dateApplied
            ? `${showUpcoming || waiting >= FOLLOW_UP_DAYS ? '' : 'Applied '}${formatDate(app.dateApplied)}`
            : `Added ${formatDate(app.stageHistory[0]?.date ?? '')}`}
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          {waiting >= FOLLOW_UP_DAYS && (
            <span
              className={`tabular rounded px-1.5 py-0.5 font-medium ${
                waiting >= STALE_DAYS ? 'bg-rose-500/10 text-rose-300' : 'bg-amber-500/10 text-amber-300'
              }`}
              title={`${waiting} days in Applied with no update`}
            >
              {waiting}d
            </span>
          )}
          {showUpcoming && app.upcoming && (
            <span
              className="flex items-center gap-1 rounded bg-sky-500/10 px-1.5 py-0.5 font-medium text-sky-300"
              title={`${UPCOMING_LABEL[app.upcoming.kind]} ${formatDate(app.upcoming.date)}`}
            >
              <CalendarClock className="h-3 w-3" />
              {relativeDay(app.upcoming.date)}
            </span>
          )}
          {done > 0 && (
            <span className="tabular flex items-center gap-1" title={`${done} of 5 prep items done`}>
              <ListChecks className="h-3 w-3" />
              {done}/5
            </span>
          )}
        </span>
      </div>
    </div>
  )
})

export function SortableCard({ app, onOpen }: { app: Application; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
    data: { stage: app.stage },
  })

  return (
    <AppCard
      ref={setNodeRef}
      app={app}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`${app.company}, ${app.role}. Press space to pick up, enter to open.`}
      onClick={() => onOpen(app.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onOpen(app.id)
          return
        }
        listeners?.onKeyDown?.(e)
      }}
    />
  )
}
