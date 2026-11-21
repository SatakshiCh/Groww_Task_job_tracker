import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  tone: 'default' | 'danger'
}

interface Ui {
  openAppId: string | null
  openApp: (id: string) => void
  closeApp: () => void
  quickAddOpen: boolean
  setQuickAddOpen: (open: boolean) => void
  toast: (message: string, tone?: Toast['tone']) => void
  toasts: Toast[]
}

const UiContext = createContext<Ui | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [openAppId, setOpenAppId] = useState<string | null>(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)

  const toast = useCallback((message: string, tone: Toast['tone'] = 'default') => {
    const id = ++seq.current
    setToasts((t) => [...t.slice(-2), { id, message, tone }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  const value = useMemo<Ui>(
    () => ({
      openAppId,
      openApp: setOpenAppId,
      closeApp: () => setOpenAppId(null),
      quickAddOpen,
      setQuickAddOpen,
      toast,
      toasts,
    }),
    [openAppId, quickAddOpen, toast, toasts],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used inside UiProvider')
  return ctx
}
