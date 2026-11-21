import { useUi } from '../store/UiStore'

export default function Toasts() {
  const { toasts } = useUi()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-pop-in rounded-lg border px-3.5 py-2 text-sm shadow-lift ${
            t.tone === 'danger' ? 'border-rose-500/30 bg-rose-950 text-rose-100' : 'border-ink-700 bg-ink-800 text-zinc-100'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
