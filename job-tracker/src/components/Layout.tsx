import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, KanbanSquare, Plus, Settings as SettingsIcon } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useUi } from '../store/UiStore'
import QuickAddModal from './QuickAddModal'
import DetailDrawer from './DetailDrawer'
import Toasts from './Toasts'

export function trackerTitle(name: string) {
  const n = name.trim()
  if (!n) return 'Job Tracker'
  return `${n}${/s$/i.test(n) ? '’' : '’s'} Job Tracker`
}

const NAV = [
  { to: '/', label: 'Board', icon: KanbanSquare, end: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
]

export default function Layout() {
  const { settings } = useStore()
  const { setQuickAddOpen, quickAddOpen, openAppId } = useUi()
  const title = trackerTitle(settings.name)

  useEffect(() => {
    document.title = title
  }, [title])

  // "n" opens quick-add from anywhere, unless you're typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return
      if (quickAddOpen || openAppId) return
      e.preventDefault()
      setQuickAddOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [quickAddOpen, openAppId, setQuickAddOpen])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/90 backdrop-blur supports-[backdrop-filter]:bg-ink-950/75">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5">
            <Logo />
            <span className="truncate text-[15px] font-semibold tracking-tight text-zinc-100">{title}</span>
          </NavLink>

          <nav className="ml-auto flex items-center gap-0.5 md:ml-6">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={label}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    isActive ? 'bg-ink-800 text-zinc-100' : 'text-zinc-400 hover:bg-ink-900 hover:text-zinc-200'
                  }`
                }
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="btn-primary ml-auto hidden md:inline-flex"
            title="Add application (N)"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add application
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 pb-28 pt-5 sm:px-6 md:pb-12">
        <Outlet />
      </main>

      {/* Phones get a thumb-reachable button instead of the header one. */}
      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Add application"
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lift transition-transform active:scale-95 md:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <QuickAddModal />
      <DetailDrawer />
      <Toasts />
    </div>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#5e6ad2" />
      <rect x="7" y="8" width="5" height="16" rx="1.5" fill="#ffffff" />
      <rect x="13.5" y="8" width="5" height="11" rx="1.5" fill="#ffffff" />
      <rect x="20" y="8" width="5" height="7" rx="1.5" fill="#ffffff" />
    </svg>
  )
}
