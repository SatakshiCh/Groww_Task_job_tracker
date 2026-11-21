import { lazy, Suspense } from 'react'
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppStoreProvider } from './store/AppStore'
import { UiProvider } from './store/UiStore'
import Layout from './components/Layout'
import BoardPage from './pages/BoardPage'
import SettingsPage from './pages/SettingsPage'

// Recharts is the heaviest dependency, so the analytics page loads on first visit.
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))

// The single-file build is opened from places that can't rewrite URLs, so it uses hash routes.
const Router = __HASH_ROUTER__ ? HashRouter : BrowserRouter

export default function App() {
  return (
    <AppStoreProvider>
      <UiProvider>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<BoardPage />} />
              <Route
                path="analytics"
                element={
                  <Suspense fallback={<div className="py-20 text-center text-sm text-zinc-500">Loading…</div>}>
                    <AnalyticsPage />
                  </Suspense>
                }
              />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </UiProvider>
    </AppStoreProvider>
  )
}
