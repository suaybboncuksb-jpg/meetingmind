import { useEffect, useState } from 'react'
import api from '../api/client.js'
import Button from './ui/Button.jsx'
import ErrorAlert from './ui/ErrorAlert.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import { ArrowLeftIcon } from './icons.jsx'
import { getApiErrorMessage } from '../lib/apiErrors.js'
import { isUnassignedTask, getDeadlineState, formatDeadline, priorityLabel } from '../lib/tasks.js'

const inputClass =
  'w-full rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink ' +
  'placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12'

function memberLabel(member) {
  const name = [member?.firstName, member?.lastName].filter(Boolean).join(' ').trim()

  return name || member?.email || ''
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

function MetaTile({ label, value, hint }) {
  return (
    <div className="rounded-[20px] border border-line bg-surface px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-[12px] leading-relaxed text-brand">{hint}</p> : null}
    </div>
  )
}

export default function TaskDetail({ task, user, onClose, onTaskUpdate, onTaskAssigneeChange, onDelete }) {
  const [draft, setDraft] = useState({
    title: '',
    assignee: '',
    deadline: '',
    priority: 'MEDIUM',
    status: 'OPEN',
  })
  const [saving, setSaving] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [comments, setComments] = useState([])
  const [commentDraft, setCommentDraft] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [postingComment, setPostingComment] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [teamMembers, setTeamMembers] = useState([])
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)

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

  useEffect(() => {
    if (!task) return

    setDraft({
      title: task.title || '',
      assignee: task.assignee || '',
      deadline: task.deadline || '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'OPEN',
    })
    setError('')
  }, [task])

  useEffect(() => {
    if (!task?.id) return

    let cancelled = false

    async function loadComments() {
      setLoadingComments(true)
      setCommentError('')

      try {
        const res = await api.get(`/tasks/${task.id}/comments`)

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
  }, [task?.id])

  if (!task) {
    return (
      <div className="rounded-card border border-line bg-surface p-8 text-center shadow-soft">
        <p className="text-[14px] text-muted">Diese Aufgabe wurde nicht gefunden.</p>
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={onClose}>Zurück zu Aufgaben & Fristen</Button>
        </div>
      </div>
    )
  }

  const unassigned = isUnassignedTask(task) && task.status !== 'DONE'
  const deadlineState = getDeadlineState(task)
  const isOverdue = deadlineState === 'overdue'

  async function handleCreateComment(event) {
    event.preventDefault()

    if (!commentDraft.trim()) {
      setCommentError('Bitte einen Kommentar eingeben.')
      return
    }

    setPostingComment(true)
    setCommentError('')

    try {
      const res = await api.post(`/tasks/${task.id}/comments`, {
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
      await onTaskUpdate?.(task.id, payload)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Aufgabe konnte nicht gespeichert werden.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignToMe() {
    setDraft((prev) => ({ ...prev, assignee: currentUserLabel }))

    if (onTaskUpdate) {
      await handleSave({ assignee: currentUserLabel })
      return
    }

    try {
      await onTaskAssigneeChange?.(task.id, currentUserLabel)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Zuständige Person konnte nicht gespeichert werden.'))
    }
  }

  async function handleQuickStatusChange(newStatus) {
    setChangingStatus(true)
    setError('')

    try {
      await onTaskUpdate?.(task.id, { status: newStatus })
      setDraft((prev) => ({ ...prev, status: newStatus }))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Status konnte nicht geändert werden.'))
    } finally {
      setChangingStatus(false)
    }
  }

  async function handleDeleteTask() {
    if (!window.confirm(`„${task.title || 'Diese Aufgabe'}“ wirklich unwiderruflich löschen?`)) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      await onDelete(task.id)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Aufgabe konnte nicht gelöscht werden.'))
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5 pt-1">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeftIcon size={16} />
        Zurück zu Aufgaben & Fristen
      </button>

      <div className="rounded-[34px] border border-line/80 bg-surface/86 shadow-card backdrop-blur-xl">
        <header className="border-b border-line px-6 py-6">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-muted">
            Aufgabenakte
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <h2 className="truncate text-[22px] font-semibold tracking-[-0.035em] text-ink">
              {task.title || 'Ohne Titel'}
            </h2>
            <StatusBadge status={task.status} />
          </div>
        </header>

        <main className="space-y-5 bg-canvas/45 px-6 py-6">
          <div className="mx-auto max-w-3xl space-y-5">
            <ErrorAlert message={error} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetaTile
                label="Frist"
                value={formatDeadline(task.deadline)}
                hint={isOverdue ? 'Frist überschritten' : null}
              />
              <MetaTile label="Priorität" value={priorityLabel(task.priority)} />
              <MetaTile
                label="Zuständige Person"
                value={task.assignee || 'Nicht zugeordnet'}
              />
              <MetaTile
                label="Besprechung"
                value={task.meetingTitle || 'Keine Besprechung verknüpft'}
              />
            </div>

            {unassigned && (
              <div className="rounded-[20px] border border-brand/25 bg-brand/[0.06] px-4 py-3.5">
                <p className="text-[13px] font-semibold text-brand">Zuständige Person fehlt</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink/70">
                  Ordne diese Aufgabe einer Person zu, damit die Bearbeitung klar übernommen werden kann.
                </p>
              </div>
            )}

            <div className="rounded-card border border-line bg-surface p-5">
              <h3 className="text-[15px] font-semibold text-ink">Aufgabe bearbeiten</h3>

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
                  <label className="mb-1.5 block text-[13px] font-medium text-ink">Zuständige Person</label>
                  <select
                    value={draft.assignee}
                    onChange={(event) => setDraft((prev) => ({ ...prev, assignee: event.target.value }))}
                    className={inputClass}
                  >
                    <option value="">— Keine zuständige Person —</option>
                    {effectiveTeamMembers.map((member) => {
                      const label = memberLabel(member)
                      return label ? (
                        <option key={member.id || member.email} value={label}>{label}</option>
                      ) : null
                    })}
                  </select>
                  <p className="mt-1.5 text-[12px] text-muted">
                    Auswahl aus deinem Kanzleiteam. Neue Mitglieder kannst du in den Einstellungen einladen.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[13px] font-medium text-ink">Frist</label>
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
                    <option value="IN_PROGRESS">In Bearbeitung</option>
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
                    Ich übernehme diese Aufgabe
                  </Button>
                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={() => handleSave()}
                  >
                    {saving ? 'Speichert…' : 'Änderungen speichern'}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  {task.status === 'OPEN' && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={changingStatus}
                        onClick={() => handleQuickStatusChange('IN_PROGRESS')}
                      >
                        In Bearbeitung setzen
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={changingStatus}
                        onClick={() => handleQuickStatusChange('DONE')}
                      >
                        Als erledigt markieren
                      </Button>
                    </>
                  )}

                  {task.status === 'IN_PROGRESS' && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={changingStatus}
                        onClick={() => handleQuickStatusChange('DONE')}
                      >
                        Als erledigt markieren
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={changingStatus}
                        onClick={() => handleQuickStatusChange('OPEN')}
                      >
                        Wieder öffnen
                      </Button>
                    </>
                  )}

                  {task.status === 'DONE' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={changingStatus}
                      onClick={() => handleQuickStatusChange('OPEN')}
                    >
                      Wieder öffnen
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-muted">Kommentare / Notizen</h3>
                <span className="text-[12px] text-muted">{comments.length}</span>
              </div>

              <div className="mt-3">
                <ErrorAlert message={commentError} />
              </div>

              <div className="mt-3 space-y-2">
                {loadingComments ? (
                  <p className="text-[13px] text-muted">Kommentare werden geladen…</p>
                ) : comments.length === 0 ? (
                  <p className="text-[12.5px] text-muted">Noch keine Kommentare zu dieser Aufgabe.</p>
                ) : (
                  <ul className="space-y-2">
                    {comments.map((comment) => (
                      <li key={comment.id} className="rounded-[16px] border border-line bg-surface px-4 py-2.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-[12.5px] font-semibold text-ink">
                            {comment.authorName || comment.authorEmail || 'Unbekannt'}
                          </p>
                          <p className="shrink-0 text-[11px] text-muted">
                            {formatCommentDate(comment.createdAt)}
                          </p>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                          {comment.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form onSubmit={handleCreateComment} className="mt-3 space-y-2">
                <textarea
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Kommentar schreiben..."
                  className="min-h-[70px] w-full resize-y rounded-button border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" variant="secondary" disabled={postingComment}>
                    {postingComment ? 'Sendet…' : 'Kommentar senden'}
                  </Button>
                </div>
              </form>
            </div>

            <div className="flex justify-end border-t border-line pt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDeleteTask}
                disabled={deleting}
              >
                {deleting ? 'Wird gelöscht…' : 'Aufgabe löschen'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}