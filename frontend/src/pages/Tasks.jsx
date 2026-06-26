import { useEffect, useMemo, useState } from 'react'
import api from '../api/client.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import DataCard from '../components/ui/DataCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Button from '../components/ui/Button.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import ErrorAlert from '../components/ui/ErrorAlert.jsx'
import { CheckSquareIcon, PlusIcon, SparklesIcon, XIcon } from '../components/icons.jsx'
import {
  isUnassignedTask,
  deadlineLabel,
  deadlineBadgeClass,
  formatDeadline,
  getDeadlineState,
} from '../lib/tasks.js'
import { getApiErrorMessage } from '../lib/apiErrors.js'
import { matchesSearch } from '../lib/search.js'
import {
  evaluateTaskQuality,
  taskQualityBadgeClass,
  taskQualityLabel,
} from '../lib/taskQuality.js'

const STATUS_TABS = [
  { key: 'all', label: 'Alle' },
  { key: 'OPEN', label: 'Offen' },
  { key: 'IN_PROGRESS', label: 'In Arbeit' },
  { key: 'DONE', label: 'Erledigt' },
]

const DEADLINE_TABS = [
  { key: 'all', label: 'Alle Deadlines' },
  { key: 'overdue', label: 'Überfällig' },
  { key: 'today', label: 'Heute' },
  { key: 'this_week', label: 'Diese Woche' },
  { key: 'none', label: 'Ohne Deadline' },
]

const PRIORITY = {
  HIGH: { label: 'Hoch', className: 'border-red-200 bg-red-50 text-red-700' },
  MEDIUM: { label: 'Mittel', className: 'border-blue-200 bg-blue-50 text-brand' },
  LOW: { label: 'Niedrig', className: 'border-line bg-soft text-muted' },
}

const inputClass =
  'w-full rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink ' +
  'placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12'


function memberLabel(member) {
  const name = [member?.firstName, member?.lastName].filter(Boolean).join(' ').trim()

  return name || member?.email || ''
}

function PriorityBadge({ priority }) {
  const meta = PRIORITY[priority] || PRIORITY.MEDIUM

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.className}`}>
      {meta.label}
    </span>
  )
}

function DeadlineBadge({ task }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${deadlineBadgeClass(task)}`}>
        {deadlineLabel(task)}
      </span>
      <span className="text-[12px] text-muted">{formatDeadline(task.deadline)}</span>
    </div>
  )
}


function TaskQualityBadge({ task }) {
  const quality = evaluateTaskQuality(task)

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${taskQualityBadgeClass(task)}`}>
        {taskQualityLabel(task)}
      </span>
      <span className="text-[12px] text-muted">{quality.summary}</span>
    </div>
  )
}

function formatCommentDate(value) {
  if (!value) return 'gerade eben'

  try {
    return new Date(value).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'gerade eben'
  }
}

function DeadlineInsight({ task }) {
  const state = getDeadlineState(task)

  const insights = {
    overdue: {
      title: 'Diese Aufgabe ist überfällig',
      description: 'Die Deadline wurde bereits überschritten. Diese Aufgabe sollte zeitnah geprüft oder neu geplant werden.',
      className: 'border-red-100 bg-red-50 text-red-800',
    },
    today: {
      title: 'Diese Aufgabe ist heute fällig',
      description: 'Diese Aufgabe sollte heute erledigt oder aktiv neu priorisiert werden.',
      className: 'border-amber-100 bg-amber-50 text-amber-800',
    },
    this_week: {
      title: 'Diese Aufgabe ist diese Woche fällig',
      description: 'Die Deadline liegt in den nächsten Tagen. Plane die Umsetzung rechtzeitig ein.',
      className: 'border-blue-100 bg-blue-50 text-brand',
    },
    none: {
      title: 'Keine Deadline eingetragen',
      description: 'Ohne Deadline ist schwer erkennbar, wann diese Aufgabe erledigt werden soll.',
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    },
    planned: {
      title: 'Deadline ist geplant',
      description: 'Diese Aufgabe hat eine spätere Deadline und ist aktuell nicht kritisch.',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
    done: {
      title: 'Aufgabe erledigt',
      description: 'Diese Aufgabe ist abgeschlossen und wird im Deadline-Radar nicht mehr als kritisch bewertet.',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    },
  }

  const insight = insights[state] || insights.planned

  return (
    <div className={`rounded-button border px-4 py-3 ${insight.className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold">{insight.title}</p>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${deadlineBadgeClass(task)}`}>
          {deadlineLabel(task)}
        </span>
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed opacity-80">
        {insight.description}
      </p>
    </div>
  )
}


function TaskQualityPanel({ task }) {
  const quality = evaluateTaskQuality(task)
  const progressClass = {
    good: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
    done: 'bg-emerald-500',
  }[quality.level] || 'bg-amber-500'

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[14px] font-semibold text-ink">Aufgabenqualität</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            MeetingMind prüft, ob diese Aufgabe klar, zugeordnet und terminlich planbar ist.
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${taskQualityBadgeClass(task)}`}>
          {quality.score} %
        </span>
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-soft">
          <div
            className={`h-full rounded-full ${progressClass}`}
            style={{ width: `${quality.score}%` }}
          />
        </div>
        <p className="mt-2 text-[12.5px] font-medium text-ink">{quality.label}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{quality.summary}</p>
      </div>

      {quality.issues.length === 0 ? (
        <div className="mt-4 rounded-button border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-[13px] font-semibold text-emerald-700">Keine offenen Qualitätsprobleme</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-emerald-700/75">
            Diese Aufgabe ist aktuell gut genug beschrieben und nachverfolgbar.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {quality.issues.map((issue) => (
            <div
              key={`${issue.title}-${issue.description}`}
              className={`rounded-button border px-4 py-3 ${
                issue.severity === 'critical'
                  ? 'border-red-100 bg-red-50 text-red-800'
                  : 'border-amber-100 bg-amber-50 text-amber-800'
              }`}
            >
              <p className="text-[13px] font-semibold">{issue.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed opacity-80">{issue.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
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
  const [deadlineFilter, setDeadlineFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
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
  const [comments, setComments] = useState([])
  const [commentDraft, setCommentDraft] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [postingComment, setPostingComment] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)


  useEffect(() => {
    let cancelled = false

    async function loadTeamMembers() {
      setLoadingTeamMembers(true)

      try {
        const res = await api.get('/team')

        if (!cancelled) {
          setTeamMembers(Array.isArray(res.data?.members) ? res.data.members : [])
        }
      } catch {
        if (!cancelled) {
          setTeamMembers([])
        }
      } finally {
        if (!cancelled) {
          setLoadingTeamMembers(false)
        }
      }
    }

    loadTeamMembers()

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(
    () => tasks.filter((task) => {
      const matchesStatus = status === 'all' || task.status === status
      const matchesDeadline = deadlineFilter === 'all' || getDeadlineState(task) === deadlineFilter
      const matchesQuery = matchesSearch(searchQuery, [
        task.title,
        task.meetingTitle,
        task.projectName,
        task.assignee,
        task.status,
        task.priority,
        task.deadline,
      ])

      return matchesStatus && matchesDeadline && matchesQuery
    }),
    [tasks, status, deadlineFilter, searchQuery],
  )

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId],
  )

  const currentUserLabel = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.email || 'Ich'

  const fallbackMember = user ? {
    id: user.id || user.email || 'me',
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  } : null

  const effectiveTeamMembers = teamMembers.length
    ? teamMembers
    : fallbackMember
      ? [fallbackMember]
      : []

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

  useEffect(() => {
    if (!selectedTaskId) {
      setComments([])
      setCommentDraft('')
      setCommentError('')
      return
    }

    let cancelled = false

    async function loadComments() {
      setLoadingComments(true)
      setCommentError('')

      try {
        const res = await api.get(`/tasks/${selectedTaskId}/comments`)

        if (!cancelled) {
          setComments(Array.isArray(res.data) ? res.data : [])
        }
      } catch (err) {
        if (!cancelled) {
          setComments([])
          setCommentError(getApiErrorMessage(err, 'Kommentare konnten nicht geladen werden.'))
        }
      } finally {
        if (!cancelled) {
          setLoadingComments(false)
        }
      }
    }

    loadComments()

    return () => {
      cancelled = true
    }
  }, [selectedTaskId])

  async function handleCreateComment(event) {
    event.preventDefault()

    if (!selectedTask || !commentDraft.trim()) {
      setCommentError('Bitte einen Kommentar eingeben.')
      return
    }

    setPostingComment(true)
    setCommentError('')

    try {
      const res = await api.post(`/tasks/${selectedTask.id}/comments`, {
        message: commentDraft.trim(),
      })

      setComments((prev) => [...prev, res.data])
      setCommentDraft('')
    } catch (err) {
      setCommentError(getApiErrorMessage(err, 'Kommentar konnte nicht gespeichert werden.'))
    } finally {
      setPostingComment(false)
    }
  }

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

      <div className="space-y-3">
        <Tabs tabs={STATUS_TABS} value={status} onChange={setStatus} />

        <div className="rounded-card border border-line bg-surface p-4 shadow-soft">
          <label htmlFor="task-search" className="mb-1.5 block text-[13px] font-medium text-ink">
            Aufgaben durchsuchen
          </label>
          <input
            id="task-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Aufgaben durchsuchen nach Titel, Projekt/Kunde, Meeting, Zuständig oder Priorität…"
            className="w-full rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[12.5px] font-semibold text-muted">Deadline-Fokus:</span>
          {DEADLINE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setDeadlineFilter(tab.key)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition ${
                deadlineFilter === tab.key
                  ? 'bg-navy text-white shadow-soft'
                  : 'border border-line bg-surface text-muted hover:bg-soft hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
          <div className="px-6 py-12 text-center text-[14px] text-muted">
            {searchQuery ? 'Keine passenden Aufgaben gefunden.' : 'Keine Aufgaben für diesen Filter.'}
          </div>
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
                  <th className="px-6 py-3">Qualität</th>
                  <th className="px-6 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((task) => {
                  const unassigned = isUnassignedTask(task) && task.status !== 'DONE'
                  const quality = evaluateTaskQuality(task)

                  return (
                    <tr
                      key={task.id}
                      className="cursor-pointer hover:bg-canvas"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <td className="px-6 py-3 font-medium text-ink">{task.title}</td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted">{task.meetingTitle || '—'}</span>
                          {task.projectName ? (
                            <span className="w-fit rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                              {task.projectName}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {unassigned ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            Kein Verantwortlicher
                          </span>
                        ) : (
                          <span className="text-muted">{task.assignee || '—'}</span>
                        )}
                      </td>
                      <td className="px-6 py-3"><DeadlineBadge task={task} /></td>
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
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${taskQualityBadgeClass(task)}`}>
                          {quality.score} %
                        </span>
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
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Workspace-Team</dt>
                    <dd className="text-right font-medium text-ink">
                      {loadingTeamMembers ? 'Lädt…' : `${effectiveTeamMembers.length || 1} Mitglied(er)`}
                    </dd>
                  </div>
                </dl>
              </div>

              <DeadlineInsight task={selectedTask} />

              <TaskQualityPanel task={selectedTask} />

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
                    <select
                      value={draft.assignee}
                      onChange={(event) => setDraft((prev) => ({ ...prev, assignee: event.target.value }))}
                      className={inputClass}
                    >
                      <option value="">— Keine Zuständige —</option>
                      {effectiveTeamMembers.map((member) => {
                        const label = memberLabel(member)
                        return label ? (
                          <option key={member.id || member.email} value={label}>{label}</option>
                        ) : null
                      })}
                    </select>
                    <p className="mt-1.5 text-[12px] text-muted">
                      Auswahl aus deinem Workspace-Team. Neue Mitglieder kannst du in den Einstellungen einladen.
                    </p>
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

              <div className="rounded-card border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-ink">Kommentare</h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                      Halte Rückfragen, Fortschritte und kurze Abstimmungen direkt an der Aufgabe fest.
                    </p>
                  </div>
                  <span className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold text-muted">
                    {comments.length}
                  </span>
                </div>

                <div className="mt-4">
                  <ErrorAlert message={commentError} />
                </div>

                <div className="mt-4 space-y-3">
                  {loadingComments ? (
                    <p className="text-[13px] text-muted">Kommentare werden geladen…</p>
                  ) : comments.length === 0 ? (
                    <div className="rounded-button border border-line bg-canvas px-4 py-3">
                      <p className="text-[13px] font-semibold text-ink">Noch keine Kommentare</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                        Schreibe den ersten Kommentar zu dieser Aufgabe.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {comments.map((comment) => (
                        <li key={comment.id} className="rounded-button border border-line bg-canvas px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-ink">
                                {comment.authorName || comment.authorEmail || 'Unbekannt'}
                              </p>
                              <p className="mt-0.5 text-[11.5px] text-muted">
                                {formatCommentDate(comment.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                            {comment.message}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <form onSubmit={handleCreateComment} className="mt-4 space-y-3">
                  <textarea
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Kommentar schreiben..."
                    className="min-h-[90px] w-full resize-y rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={postingComment}>
                      {postingComment ? 'Sendet…' : 'Kommentar senden'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
