import { useMemo, useState } from 'react'
import { Inbox, Plus, SearchX } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useUi } from '../store/UiStore'
import AlertStrip from '../components/AlertStrip'
import FilterBar from '../components/FilterBar'
import Board from '../components/Board'
import { applyFilters, EMPTY_FILTERS, hasActiveFilters, type Filters } from '../lib/filters'
import { STAGES } from '../lib/constants'

export default function BoardPage() {
  const { applications } = useStore()
  const { setQuickAddOpen } = useUi()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const visible = useMemo(() => applyFilters(applications, filters), [applications, filters])
  const visibleStages = filters.stages.length ? STAGES.filter((s) => filters.stages.includes(s)) : STAGES
  const filtered = hasActiveFilters(filters)

  return (
    <>
      <AlertStrip apps={applications} />
      <FilterBar filters={filters} onChange={setFilters} shown={visible.length} total={applications.length} />

      {visible.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-800 text-zinc-400">
            {filtered && applications.length > 0 ? <SearchX className="h-5 w-5" /> : <Inbox className="h-5 w-5" />}
          </div>
          <h2 className="text-base font-semibold text-zinc-100">No applications yet — add your first one!</h2>
          <p className="mt-1.5 max-w-sm text-sm text-zinc-400">
            {filtered && applications.length > 0
              ? 'Nothing matches these filters. Loosen them, or log something new.'
              : 'Logging one takes about 15 seconds: company, role, done.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-primary" onClick={() => setQuickAddOpen(true)}>
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Add application
            </button>
            {filtered && applications.length > 0 && (
              <button type="button" className="btn-outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <Board apps={visible} visibleStages={visibleStages} />
      )}
    </>
  )
}
