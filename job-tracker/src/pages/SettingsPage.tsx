import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Copy, Download, Plus, RotateCcw, Upload, X } from 'lucide-react'
import { useStore } from '../store/AppStore'
import { useUi } from '../store/UiStore'
import { ConfirmDialog } from '../components/Modal'
import { trackerTitle } from '../components/Layout'
import { parseImport } from '../lib/storage'
import { plural, today } from '../lib/dates'
import type { Application, Settings } from '../types'

export default function SettingsPage() {
  const { settings, updateSettings, applications, replaceAll, resetToSeed } = useStore()
  const { toast } = useUi()
  const [newVersion, setNewVersion] = useState('')
  const [pendingImport, setPendingImport] = useState<{ applications: Application[]; settings: Settings | null; file: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const inUse = (v: string) => applications.filter((a) => a.resumeVersion === v).length

  const addVersion = (e: FormEvent) => {
    e.preventDefault()
    const v = newVersion.trim()
    if (!v) return
    if (settings.resumeVersions.some((x) => x.toLowerCase() === v.toLowerCase())) {
      toast(`"${v}" is already in the list`)
      return
    }
    updateSettings({ resumeVersions: [...settings.resumeVersions, v] })
    setNewVersion('')
  }

  const backupJson = () =>
    JSON.stringify({ app: 'job-application-tracker', version: 1, exportedAt: new Date().toISOString(), settings, applications }, null, 2)

  // Some embedded previews block file downloads, so copying the same JSON is offered as well.
  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(backupJson())
      toast('Backup JSON copied to clipboard')
    } catch {
      toast("Couldn't access the clipboard here", 'danger')
    }
  }

  const exportJson = () => {
    const blob = new Blob([backupJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `job-tracker-backup-${today()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast(`Exported ${plural(applications.length, 'application')}`)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed = parseImport(await file.text())
      setPendingImport({ ...parsed, file: file.name })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not read that file', 'danger')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Settings</h1>
        <p className="mt-0.5 text-sm text-zinc-400">Everything is stored in this browser only. Export a backup before clearing site data.</p>
      </div>

      <Card title="Your name" description={`Optional. The header currently reads “${trackerTitle(settings.name)}”.`}>
        <input
          className="field max-w-xs"
          value={settings.name}
          onChange={(e) => updateSettings({ name: e.target.value })}
          placeholder="Your first name"
          aria-label="Your name"
        />
      </Card>

      <Card title="Resume versions" description="Tag each application with the resume you sent. These show up in the add-application form.">
        <ul className="divide-y divide-ink-800 rounded-lg border border-ink-800">
          {settings.resumeVersions.length === 0 && <li className="px-3 py-2.5 text-sm text-zinc-500">No versions yet.</li>}
          {settings.resumeVersions.map((v) => {
            const n = inUse(v)
            return (
              <li key={v} className="flex items-center gap-3 px-3 py-2">
                <span className="text-sm text-zinc-200">{v}</span>
                {n > 0 && <span className="tabular text-xs text-zinc-500">used by {n}</span>}
                <button
                  type="button"
                  onClick={() => updateSettings({ resumeVersions: settings.resumeVersions.filter((x) => x !== v) })}
                  className="btn-ghost ml-auto h-7 w-7 p-0 text-zinc-500 hover:text-rose-300"
                  aria-label={`Remove ${v}`}
                  title={n ? 'Removing keeps it on existing applications' : 'Remove'}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
        <form onSubmit={addVersion} className="mt-3 flex gap-2">
          <input
            className="field"
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
            placeholder="e.g. Resume v3 - Data"
            aria-label="New resume version"
          />
          <button type="submit" className="btn-outline shrink-0" disabled={!newVersion.trim()}>
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      </Card>

      <Card title="Backup" description="Download everything as a JSON file, or restore from one you exported earlier.">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline" onClick={exportJson}>
            <Download className="h-4 w-4" />
            Export as JSON
          </button>
          <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import from JSON
          </button>
          <button type="button" className="btn-ghost" onClick={copyJson}>
            <Copy className="h-4 w-4" />
            Copy JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      </Card>

      <Card title="Reset" description="Deletes every application, note and setting, then reloads the 8 demo applications." danger>
        <button type="button" className="btn border border-rose-500/40 text-rose-300 hover:bg-rose-500/10" onClick={() => setConfirmReset(true)}>
          <RotateCcw className="h-4 w-4" />
          Reset all data
        </button>
      </Card>

      <ConfirmDialog
        open={!!pendingImport}
        title="Replace your data?"
        message={
          pendingImport && (
            <>
              <span className="text-zinc-200">{pendingImport.file}</span> has {plural(pendingImport.applications.length, 'application')}. Importing
              replaces the {plural(applications.length, 'application')} on your board now.
            </>
          )
        }
        confirmLabel="Import"
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          if (!pendingImport) return
          replaceAll(pendingImport.applications, pendingImport.settings ?? undefined)
          toast(`Imported ${plural(pendingImport.applications.length, 'application')}`)
          setPendingImport(null)
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset all data?"
        message="This clears everything stored in this browser and brings back the demo applications. Export first if you want to keep anything."
        confirmLabel="Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetToSeed()
          setConfirmReset(false)
          toast('Reset to demo data')
        }}
      />
    </div>
  )
}

function Card({ title, description, children, danger }: { title: string; description: string; children: ReactNode; danger?: boolean }) {
  return (
    <section className={`panel p-5 ${danger ? 'border-rose-500/20' : ''}`}>
      <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
      <p className="mb-4 mt-1 text-sm text-zinc-400">{description}</p>
      {children}
    </section>
  )
}
