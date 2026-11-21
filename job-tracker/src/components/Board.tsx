import { useMemo, useRef, useState } from 'react'
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Application, Stage } from '../types'
import { STAGES, STAGE_META } from '../lib/constants'
import { useStore } from '../store/AppStore'
import { useUi } from '../store/UiStore'
import { AppCard, SortableCard } from './AppCard'

type Columns = Record<Stage, string[]>

function buildColumns(apps: Application[]): Columns {
  const cols = Object.fromEntries(STAGES.map((s) => [s, [] as string[]])) as Columns
  ;[...apps].sort((a, b) => a.position - b.position).forEach((a) => cols[a.stage].push(a.id))
  return cols
}

const isStage = (id: unknown): id is Stage => typeof id === 'string' && (STAGES as string[]).includes(id)

export default function Board({ apps, visibleStages }: { apps: Application[]; visibleStages: Stage[] }) {
  const { applications, moveApplication } = useStore()
  const { openApp, toast } = useUi()

  const baseColumns = useMemo(() => buildColumns(apps), [apps])
  // While dragging, the board renders from a scratch copy so cards can hop columns live
  // without touching saved data until the drop actually happens.
  const [dragColumns, setDragColumns] = useState<Columns | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const originStage = useRef<Stage | null>(null)
  const columns = dragColumns ?? baseColumns

  const byId = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // A short press-and-hold on touch, so a normal swipe still scrolls the board sideways.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findStage = (id: string, cols: Columns): Stage | null => {
    if (isStage(id)) return id
    return STAGES.find((s) => cols[s].includes(id)) ?? null
  }

  const onDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id)
    setActiveId(id)
    setDragColumns(baseColumns)
    originStage.current = findStage(id, baseColumns)
  }

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    setDragColumns((prev) => {
      const cols = prev ?? baseColumns
      const id = String(active.id)
      const overId = String(over.id)
      const from = findStage(id, cols)
      const to = findStage(overId, cols)
      if (!from || !to || from === to) return prev

      const target = cols[to]
      let index = isStage(overId) ? target.length : target.indexOf(overId)
      // Dropping on the lower half of a card puts it after that card.
      if (!isStage(overId) && over.rect && active.rect.current.translated) {
        const below = active.rect.current.translated.top > over.rect.top + over.rect.height / 2
        if (below) index += 1
      }
      if (index < 0) index = target.length

      return {
        ...cols,
        [from]: cols[from].filter((x) => x !== id),
        [to]: [...target.slice(0, index), id, ...target.slice(index)],
      }
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id)
    const cols = dragColumns ?? baseColumns
    const origin = originStage.current
    setActiveId(null)
    setDragColumns(null)
    originStage.current = null
    if (!over || !origin) return

    const stage = findStage(id, cols)
    if (!stage) return

    let list = cols[stage]
    const overId = String(over.id)
    if (!isStage(overId) && list.includes(overId) && overId !== id) {
      list = arrayMove(list, list.indexOf(id), list.indexOf(overId))
    }

    const idx = list.indexOf(id)
    const prev = byId.get(list[idx - 1])?.position
    const next = byId.get(list[idx + 1])?.position
    const position =
      prev !== undefined && next !== undefined ? (prev + next) / 2 : prev !== undefined ? prev + 1 : next !== undefined ? next - 1 : 0

    const app = byId.get(id)
    if (!app) return
    if (stage === origin && position === app.position) return

    moveApplication(id, stage, position)
    if (stage !== origin) toast(`${app.company} moved to ${STAGE_META[stage].short}`)
  }

  const onDragCancel = () => {
    setActiveId(null)
    setDragColumns(null)
    originStage.current = null
  }

  const active = activeId ? byId.get(activeId) : undefined
  const stages = STAGES.filter((s) => visibleStages.includes(s))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="-mx-4 overflow-x-auto px-4 pb-4 scrollbar-thin sm:-mx-6 sm:px-6 xl:overflow-visible">
        <div
          className="grid snap-x snap-proximity gap-3 [--col-min:min(78vw,17rem)] md:[--col-min:15.5rem] xl:snap-none xl:[--col-min:0px]"
          style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(var(--col-min), 1fr))` }}
        >
          {stages.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              ids={columns[stage]}
              byId={byId}
              onOpen={openApp}
              highlight={!!activeId && findStage(activeId, columns) === stage && originStage.current !== stage}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' }}>
        {active ? <AppCard app={active} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function Column({
  stage,
  ids,
  byId,
  onOpen,
  highlight,
}: {
  stage: Stage
  ids: string[]
  byId: Map<string, Application>
  onOpen: (id: string) => void
  highlight: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const meta = STAGE_META[stage]

  return (
    <section
      className={`flex min-h-[calc(100vh-18rem)] snap-start flex-col rounded-xl border bg-ink-900/60 transition-colors md:min-h-[420px] ${
        highlight || isOver ? 'border-ink-600 bg-ink-900' : 'border-ink-800'
      }`}
      aria-label={`${meta.label}, ${ids.length} applications`}
    >
      <header className="flex items-center gap-2 px-3 pb-2 pt-3" title={meta.hint}>
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
        <h2 className="truncate text-[13px] font-semibold text-zinc-200">{meta.label}</h2>
        <span className="tabular ml-auto rounded-md bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-zinc-400">{ids.length}</span>
      </header>

      <SortableContext id={stage} items={ids} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-1 flex-col gap-2 px-2 pb-2">
          {ids.map((id) => {
            const app = byId.get(id)
            return app ? <SortableCard key={id} app={app} onOpen={onOpen} /> : null
          })}
          {ids.length === 0 && (
            <div className="flex flex-1 items-start justify-center rounded-lg border border-dashed border-ink-700/70 px-3 py-6 text-center text-xs text-zinc-600">
              Drop a card here
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  )
}
