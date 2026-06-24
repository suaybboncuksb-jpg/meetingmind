import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader.jsx'
import DataCard from '../components/ui/DataCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Button from '../components/ui/Button.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import ErrorAlert from '../components/ui/ErrorAlert.jsx'
import { CheckSquareIcon, PlusIcon, SparklesIcon, XIcon } from '../components/icons.jsx'
import { isUnassignedTask } from '../lib/tasks.js'
import { getApiErrorMessage } from '../lib/apiErrors.js'

const STATUS_TABS = [
  { key: 'all', label: 'Alle' },
  { key: 'OPEN', label: 'Offen' },
  { key: 'IN_PROGRESS', label: 'In Arbeit' },
  { key: 'DONE', label: 'Erledigt' },
]

const PRIORITY = {
  HIGH: { label: 'Hoch', className: 'border-red-200 bg-red-50 text-red-700' },
  MEDIUM: { label: 'Mittel', className: 'border-blue-200 bg-blue-50 text-brand' },
  LOW: { label: 'Niedrig', className: 'border-line bg-soft text-muted' },
}

const inputClass =
  'w-full rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink ' +
  'placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12'

function PriorityBadge({ priority }) {
  const meta = PRIORITY[priority] || PRIORITY.MEDIUM

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.className}`}>
      {meta.label}
    </span>
  )
}

export default function Tasks({
  user,
  tasks = [],
  onStatusChange,
  onTaskAssigneeChange,
  onTaskUpdate,
  onNewTask,
  onNavigate,
}) {
  const [status, setStatus] = useState('all')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [draft, setDraft] = useState({
    title: '',
    assignee: '',
    deadline: '',
    priority: 'MEDIUM',
    status: 'OPEN',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(
    () => (status === 'all' ? tasks : tasks.filter((task) => task.status === status)),
    [tasks, status],
  )

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId],
  )

  const currentUserLabel = user?.firstName || user?.name || user?.email || 'Ich'

  useEffect(() => {
    if (!selectedTask) {
      setDraft({
        title: '',
        assignee: '',
        deadline: '',
        priority: 'MEDIUM',
        status: 'OPEN',
      })
      setError('')
      return
    }

    setDraft({
      title: selectedTask.title || '',
      assignee: selectedTask.assignee || '',
      deadline: selectedTask.deadline || '',
      priority: selectedTask.priority || 'MEDIUM',
      status: selectedTask.status || 'OPEN',
    })
    setError('')
  }, [selectedTask])

  async function handleSave(changes = null) {
    if (!selectedTask) return

    const payload = changes || {
      title: draft.title.trim(),
      assignee: draft.assignee.trim() || null,
      deadline: draft.deadline || null,
      priority: draft.priority,
      status: draft.status,
    }

    if (!payload.title && !changes) {
      setError('Der Aufgabentitel darf nicht leer sein.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await onTaskUpdate?.(selectedTask.id, payload)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Aufgabe konnte nicht gespeichert werden.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignToMe() {
    if (!selectedTask) return

    setDraft((prev) => ({ ...prev, assignee: currentUserLabel }))

    if (onTaskUpdate) {
      await handleSave({ assignee: currentUserLabel })
      return
    }

    try {
      await onTaskAssigneeChange?.(selectedTask.id, currentUserLabel)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Verantwortlicher konnte nicht gespeichert werden.'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aufgaben"
        subtitle="Alle Action Items aus deinen Meetings – zentral an einem Ort."
        actions={<Button icon={PlusIcon} onClick={onNewTask}>Neue Aufgabe</Button>}
      />

      <Tabs tabs={STATUS_TABS} value={status} onChange={setStatus} />

      <DataCard noPadding>
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquareIcon}
            title="Noch keine Aufgaben"
            description="Lege eine Aufgabe an oder analysiere ein Meeting-Protokoll mit KI."
            action={
              <div className="flex gap-2">
                <Button size="sm" icon={PlusIcon} onClick={onNewTask}>Neue Aufgabe</Button>
                <Button size="sm" variant="secondary" icon={SparklesIcon} onClick={() => onNavigate('meetings')}>Meeting analysieren</Button>
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[14px] text-muted">Keine Aufgaben in diesem Status.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-line text-[12px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-3">Aufgabe</th>
                  <th className="px-6 py-3">Meeting</th>
                  <th className="px-6 py-3">Zuständig</th>
                  <th className="px-6 py-3">Deadline</th>
                  <th className="px-6 py-3">Priorität</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((task) => {
                  const unassigned = isUnassignedTask(task) && task.status !== 'DONE'

                  return (
                    <tr
                      key={task.id}
                      className="cursor-pointer hover:bg-canvas"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <td className="px-6 py-3 font-medium text-ink">{task.title}</td>
                      <td className="px-6 py-3 text-muted">{task.meetingTitle || '—'}</td>
                      <td className="px-6 py-3">
                        {unassigned ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            Kein Verantwortlicher
                          </span>
                        ) : (
                          <span className="text-muted">{task.assignee || '—'}</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-muted">{task.deadline || '—'}</td>
                      <td className="px-6 py-3"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-6 py-3" onClick={(event) => event.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(event) => onStatusChange(task.id, event.target.value)}
                          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] font-medium text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                        >
                          <option value="OPEN">Offen</option>
                          <option value="IN_PROGRESS">In Arbeit</option>
                          <option value="DONE">Erledigt</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedTaskId(task.id)
                          }}
                          className="rounded-button px-3 py-1.5 text-[12px] font-semibold text-brand transition hover:bg-brand/10"
                        >
                          Öffnen
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>

      {selectedTask && (
        <div
          className="fixed inset-0 z-[70] flex justify-end bg-navy/25 backdrop-blur-sm"
          onClick={() => setSelectedTaskId(null)}
        >
          <aside
            className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface p-6 shadow-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Aufgabendetails</p>
                <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-ink">
                  {selectedTask.title || 'Ohne Titel'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="rounded-lg p-1.5 text-muted transition hover:bg-soft hover:text-ink"
                aria-label="Schließen"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-card border border-line bg-canvas p-4">
                <dl className="space-y-3 text-[13px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Meeting</dt>
                    <dd className="text-right font-medium text-ink">{selectedTask.meetingTitle || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Aktueller Status</dt>
                    <dd><StatusBadge status={selectedTask.status} /></dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Aktuell zuständig</dt>
                    <dd className="text-right font-medium text-ink">{selectedTask.assignee || '—'}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-card border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-ink">Aufgabe bearbeiten</h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                      Ändere Verantwortlichkeit, Deadline, Priorität oder Status direkt hier.
                    </p>
                  </div>
                  {isUnassignedTask(selectedTask) && selectedTask.status !== 'DONE' ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      Offen
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Zugeordnet
                    </span>
                  )}
                </div>

                {isUnassignedTask(selectedTask) && selectedTask.status !== 'DONE' && (
                  <div className="mt-4 rounded-button border border-amber-100 bg-amber-50 px-4 py-3">
                    <p className="text-[13px] font-semibold text-amber-800">Kein Verantwortlicher eingetragen</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-amber-800/75">
                      Diese Aufgabe sollte einer Person zugeordnet werden, damit sie nicht liegen bleibt.
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <ErrorAlert message={error} />
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">Aufgabe</label>
                    <input
                      value={draft.title}
                      onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                      className={inputClass}
                      placeholder="Aufgabe"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">Zuständig</label>
                    <input
                      value={draft.assignee}
                      onChange={(event) => setDraft((prev) => ({ ...prev, assignee: event.target.value }))}
                      className={inputClass}
                      placeholder="Name eintragen"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-medium text-ink">Deadline</label>
                      <input
                        type="date"
                        value={draft.deadline}
                        onChange={(event) => setDraft((prev) => ({ ...prev, deadline: event.target.value }))}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[13px] font-medium text-ink">Priorität</label>
                      <select
                        value={draft.priority}
                        onChange={(event) => setDraft((prev) => ({ ...prev, priority: event.target.value }))}
                        className={inputClass}
                      >
                        <option value="LOW">Niedrig</option>
                        <option value="MEDIUM">Mittel</option>
                        <option value="HIGH">Hoch</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">Status</label>
                    <select
                      value={draft.status}
                      onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
                      className={inputClass}
                    >
                      <option value="OPEN">Offen</option>
                      <option value="IN_PROGRESS">In Arbeit</option>
                      <option value="DONE">Erledigt</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={saving}
                      onClick={handleAssignToMe}
                    >
                      Ich übernehme
                    </Button>
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={() => handleSave()}
                    >
                      {saving ? 'Speichert…' : 'Änderungen speichern'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
