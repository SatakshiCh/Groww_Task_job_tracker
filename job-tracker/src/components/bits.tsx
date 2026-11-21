import type { Priority, Stage } from '../types'
import { PRIORITY_META, STAGE_META } from '../lib/constants'

// Muted, readable-on-dark backgrounds for the company initial. Picked by name so a
// company keeps the same colour everywhere.
const AVATAR_COLORS = [
  'bg-sky-500/15 text-sky-300',
  'bg-violet-500/15 text-violet-300',
  'bg-emerald-500/15 text-emerald-300',
  'bg-amber-500/15 text-amber-300',
  'bg-rose-500/15 text-rose-300',
  'bg-cyan-500/15 text-cyan-300',
  'bg-fuchsia-500/15 text-fuchsia-300',
  'bg-lime-500/15 text-lime-300',
  'bg-orange-500/15 text-orange-300',
  'bg-indigo-500/15 text-indigo-300',
]

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function CompanyAvatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const letter = (name.trim()[0] ?? '?').toUpperCase()
  const color = AVATAR_COLORS[hash(name.trim().toLowerCase()) % AVATAR_COLORS.length]
  const dims = size === 'lg' ? 'h-11 w-11 text-lg rounded-xl' : 'h-8 w-8 text-sm rounded-lg'
  return (
    <div className={`flex shrink-0 items-center justify-center font-semibold ${dims} ${color}`} aria-hidden>
      {letter}
    </div>
  )
}

export function PriorityDot({ priority, className = '' }: { priority: Priority; className?: string }) {
  const meta = PRIORITY_META[priority]
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${meta.dot} ${className}`}
      title={`${meta.label} priority`}
      aria-label={`${meta.label} priority`}
    />
  )
}

export function StageDot({ stage, className = '' }: { stage: Stage; className?: string }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${STAGE_META[stage].dot} ${className}`} aria-hidden />
}
