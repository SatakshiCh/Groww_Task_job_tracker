import { useMemo, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store/AppStore'
import { computeStats, computeTransitions } from '../lib/insights'
import { SOURCES, STAGES, STAGE_META, sourceLabel } from '../lib/constants'
import { plural } from '../lib/dates'

// Single-series charts use one hue; the source donut uses a fixed categorical order
// (checked for colour-blind separation on this dark surface). Colour follows the source,
// so filtering or empty sources never repaint the others.
const BAR = '#6e78dc'
const SOURCE_COLORS: Record<string, string> = {
  LinkedIn: '#3987e5',
  'Company Portal': '#d95926',
  'Campus Placement': '#199e70',
  Referral: '#c98500',
  'Cold Email': '#d55181',
  Other: '#9085e9',
}
const AXIS = { fill: '#a1a1aa', fontSize: 12 }
const GRID = '#232326'

const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`)

export default function AnalyticsPage() {
  const { applications } = useStore()
  const stats = useMemo(() => computeStats(applications), [applications])
  const transitions = useMemo(() => computeTransitions(applications), [applications])

  const pipeline = STAGES.map((s) => ({
    stage: STAGE_META[s].short,
    full: STAGE_META[s].label,
    count: applications.filter((a) => a.stage === s).length,
  }))

  const sources = SOURCES.map((s) => ({
    key: s.value,
    name: s.label,
    value: applications.filter((a) => a.source === s.value).length,
  }))
  const otherSources = applications.filter((a) => !SOURCES.some((s) => s.value === a.source)).length
  if (otherSources) sources[sources.length - 1].value += otherSources
  const sourceTotal = sources.reduce((n, s) => n + s.value, 0)

  if (applications.length === 0) {
    return (
      <div className="panel px-6 py-20 text-center">
        <h1 className="text-base font-semibold text-zinc-100">Nothing to analyse yet</h1>
        <p className="mt-1.5 text-sm text-zinc-400">Add a few applications on the board and the numbers show up here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Analytics</h1>
        <p className="mt-0.5 text-sm text-zinc-400">How the search is going, worked out from your board.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total applications"
          value={String(stats.submitted)}
          note={stats.wishlist ? `+${stats.wishlist} on wishlist` : 'Wishlist is empty'}
        />
        <StatCard
          label="Response rate"
          value={pct(stats.responseRate)}
          note={`${stats.responded} of ${stats.submitted} got an OA or interview`}
        />
        <StatCard label="Offer rate" value={pct(stats.offerRate)} note={`${plural(stats.offers, 'offer')} from ${stats.submitted}`} />
        <StatCard
          label="Avg. days in pipeline"
          value={stats.avgDaysInPipeline === null ? '—' : stats.avgDaysInPipeline.toFixed(1)}
          note="First entry to today, or to offer / rejection"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <ChartPanel title="Pipeline breakdown" subtitle="Applications in each stage right now" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipeline} margin={{ top: 20, right: 8, left: -20, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="stage" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(161,161,170,0.07)' }} content={<ChartTip render={(p) => `${p.full}: ${plural(p.count, 'application')}`} />} />
              <Bar dataKey="count" fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={44}>
                <LabelList dataKey="count" position="top" fill="#cbd5e1" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Where they came from" subtitle="Applications by source" className="lg:col-span-2">
          <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
            <div className="relative h-[190px] w-[190px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sources.filter((s) => s.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                    stroke="#111113"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {sources
                      .filter((s) => s.value > 0)
                      .map((s) => (
                        <Cell key={s.key} fill={SOURCE_COLORS[s.key]} />
                      ))}
                  </Pie>
                  <Tooltip content={<ChartTip render={(p) => `${p.name}: ${p.value}`} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="tabular text-2xl font-semibold text-zinc-100">{sourceTotal}</span>
                <span className="text-[11px] text-zinc-500">incl. wishlist</span>
              </div>
            </div>
            <ul className="w-full space-y-1.5">
              {sources.map((s) => (
                <li key={s.key} className={`flex items-center gap-2.5 text-sm ${s.value ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.value ? SOURCE_COLORS[s.key] : '#27272a' }} />
                  <span className="truncate">{sourceLabel(s.key)}</span>
                  <span className="tabular ml-auto text-zinc-400">{s.value}</span>
                  <span className="tabular w-10 text-right text-xs text-zinc-500">
                    {sourceTotal ? `${Math.round((s.value / sourceTotal) * 100)}%` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ChartPanel>
      </div>

      <ChartPanel title="Average days per stage" subtitle="Time between one stage change and the next">
        {transitions.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">Move a card from one column to another and the timing shows up here.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, transitions.length * 44 + 30)}>
            <BarChart data={transitions} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }} barCategoryGap="30%">
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="label" tick={AXIS} axisLine={false} tickLine={false} width={150} />
              <Tooltip
                cursor={{ fill: 'rgba(161,161,170,0.07)' }}
                content={<ChartTip render={(p) => `${p.label}: avg ${p.avg} days (${plural(p.count, 'move')})`} />}
              />
              <Bar dataKey="avg" fill={BAR} radius={[0, 4, 4, 0]} maxBarSize={22}>
                <LabelList dataKey="avg" position="right" fill="#cbd5e1" fontSize={12} formatter={(v: number) => `${v}d`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>
    </div>
  )
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="panel p-4">
      <div className="text-xs font-medium text-zinc-400">{label}</div>
      <div className="tabular mt-1.5 text-[28px] font-semibold leading-none tracking-tight text-zinc-50">{value}</div>
      <div className="mt-2 text-xs leading-snug text-zinc-500">{note}</div>
    </div>
  )
}

function ChartPanel({ title, subtitle, children, className = '' }: { title: string; subtitle: string; children: ReactNode; className?: string }) {
  return (
    <section className={`panel p-4 sm:p-5 ${className}`}>
      <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
      <p className="mb-4 mt-0.5 text-xs text-zinc-500">{subtitle}</p>
      {children}
    </section>
  )
}

type Row = any // Recharts hands back whatever row object the chart was given
function ChartTip({ active, payload, render }: { active?: boolean; payload?: { payload: Row }[]; render: (p: Row) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-ink-700 bg-ink-800 px-2.5 py-1.5 text-xs text-zinc-100 shadow-lift">
      {render(payload[0].payload)}
    </div>
  )
}
