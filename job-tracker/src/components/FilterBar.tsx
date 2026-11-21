import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import type { Priority, Stage } from '../types'
import { PRIORITIES, PRIORITY_META, SOURCES, STAGES, STAGE_META } from '../lib/constants'
import { EMPTY_FILTERS, hasActiveFilters, type DateRange, type Filters } from '../lib/filters'

const RANGES: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  shown: number
  total: number
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function FilterBar({ filters, onChange, shown, total }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const active = hasActiveFilters(filters)

  return (
    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
      <label className="relative block lg:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Search company or role"
          aria-label="Search company or role"
          className="field h-9 pl-9"
        />
      </label>

      <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Menu label="Stage" count={filters.stages.length}>
          {STAGES.map((s: Stage) => (
            <Option key={s} checked={filters.stages.includes(s)} onSelect={() => set({ stages: toggle(filters.stages, s) })}>
              <span className={`h-2 w-2 rounded-full ${STAGE_META[s].dot}`} />
              {STAGE_META[s].label}
            </Option>
          ))}
        </Menu>

        <Menu label="Priority" count={filters.priorities.length}>
          {PRIORITIES.map((p: Priority) => (
            <Option key={p} checked={filters.priorities.includes(p)} onSelect={() => set({ priorities: toggle(filters.priorities, p) })}>
              <span className={`h-2 w-2 rounded-full ${PRIORITY_META[p].dot}`} />
              {PRIORITY_META[p].label}
            </Option>
          ))}
        </Menu>

        <Menu label="Source" count={filters.sources.length}>
          {SOURCES.map((s) => (
            <Option key={s.value} checked={filters.sources.includes(s.value)} onSelect={() => set({ sources: toggle(filters.sources, s.value) })}>
              {s.label}
            </Option>
          ))}
        </Menu>

        <Menu label={filters.range === 'all' ? 'Date' : RANGES.find((r) => r.value === filters.range)!.label} count={0} highlight={filters.range !== 'all'} alignRight single>
          {RANGES.map((r) => (
            <Option key={r.value} checked={filters.range === r.value} onSelect={() => set({ range: r.value })} radio>
              {r.label}
            </Option>
          ))}
        </Menu>

      </div>

      <div className="flex items-center gap-2 lg:ml-auto">
        {active && (
          <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="btn-ghost h-7 px-2 text-xs text-zinc-400 lg:order-2">
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
        <span className="tabular text-xs text-zinc-500">{active ? `Showing ${shown} of ${total}` : `${total} total`}</span>
      </div>
    </div>
  )
}

function Menu({
  label,
  count,
  children,
  highlight,
  alignRight,
  single,
}: {
  label: string
  count: number
  children: ReactNode
  highlight?: boolean
  alignRight?: boolean
  single?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const on = highlight || count > 0

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`tabular inline-flex h-9 w-full items-center justify-center gap-1 rounded-md border px-2 text-[13px] transition-colors sm:w-auto sm:gap-1.5 sm:px-3 sm:text-sm ${
          on ? 'border-brand-500/40 bg-brand-500/10 text-brand-400' : 'border-ink-700 bg-ink-900 text-zinc-300 hover:border-ink-600'
        }`}
      >
        <span className="truncate">{label}</span>
        {count > 0 && <span className="rounded bg-brand-500/20 px-1 text-[11px] font-semibold">{count}</span>}
        <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="menu"
          onClick={single ? () => setOpen(false) : undefined}
          className={`absolute top-full z-40 mt-1.5 min-w-[200px] animate-pop-in rounded-lg border border-ink-700 bg-ink-850 p-1 shadow-lift ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function Option({
  checked,
  onSelect,
  children,
  radio,
}: {
  checked: boolean
  onSelect: () => void
  children: ReactNode
  radio?: boolean
}) {
  return (
    <button
      type="button"
      role={radio ? 'menuitemradio' : 'menuitemcheckbox'}
      aria-checked={checked}
      onClick={onSelect}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm text-zinc-200 hover:bg-ink-700/60"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center border ${radio ? 'rounded-full' : 'rounded'} ${
          checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-600'
        }`}
      >
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      {children}
    </button>
  )
}
