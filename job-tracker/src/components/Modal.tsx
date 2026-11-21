import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function useEscape(active: boolean, onEscape: () => void) {
  const cb = useRef(onEscape)
  cb.current = onEscape
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        cb.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])
}

export function useBodyLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: string
}) {
  useEscape(open, onClose)
  useBodyLock(open)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} />
      <div
        className={`relative max-h-[92vh] w-full ${width} animate-pop-in overflow-y-auto rounded-t-2xl border border-ink-700 bg-ink-900 shadow-lift scrollbar-thin sm:rounded-xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-800 bg-ink-900 px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-zinc-100">{title}</h2>
          <button type="button" onClick={onClose} className="btn-ghost -mr-2 h-8 w-8 p-0" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEscape(open, onCancel)
  useEffect(() => {
    if (open) confirmRef.current?.focus()
  }, [open])
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-black/70" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-pop-in rounded-xl border border-ink-700 bg-ink-900 p-5 shadow-lift">
        <h2 className="text-[15px] font-semibold text-zinc-100">{title}</h2>
        <div className="mt-2 text-sm leading-relaxed text-zinc-400">{message}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button ref={confirmRef} type="button" className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
