import { useEffect, useState } from 'react'
import api from '../api/client.js'
import Button from './ui/Button.jsx'
import ErrorAlert from './ui/ErrorAlert.jsx'
import { XIcon } from './icons.jsx'
import { getApiErrorMessage } from '../lib/apiErrors.js'

const inputClass =
  'w-full rounded-button border border-line bg-surface px-3.5 py-3 text-[15px] text-ink ' +
  'placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12'


function memberLabel(member) {
  const name = [member?.firstName, member?.lastName].filter(Boolean).join(' ').trim()

  return name || member?.email || ''
}

/** Modal zum manuellen Anlegen einer Aufgabe (POST /api/tasks). */
export default function CreateTaskModal({ meetings = [], user, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [meetingId, setMeetingId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [teamMembers, setTeamMembers] = useState([])

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
      try {
        const res = await api.get('/team')

        if (!cancelled) {
          setTeamMembers(Array.isArray(res.data?.members) ? res.data.members : [])
        }
      } catch {
        if (!cancelled) {
          setTeamMembers([])
        }
      }
    }

    loadTeamMembers()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const cleanTitle = title.trim()

    if (!cleanTitle) {
      setError('Task-Titel darf nicht leer sein.')
      setSaving(false)
      return
    }

    try {
      const res = await api.post('/tasks', {
        title: cleanTitle,
        assignee: assignee.trim() || null,
        deadline: deadline || null,
        priority,
        meetingId: meetingId ? Number(meetingId) : null,
      })

      onCreated(res.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Aufgabe konnte nicht erstellt werden.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">Neue Aufgabe</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted transition hover:bg-soft hover:text-ink" aria-label="Schließen">
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error} />
          <div>
            <label htmlFor="t-title" className="mb-1.5 block text-[13px] font-medium text-ink">Aufgabe</label>
            <input id="t-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Angebot finalisieren" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="t-assignee" className="mb-1.5 block text-[13px] font-medium text-ink">Zuständig</label>
              <select
                id="t-assignee"
                className={inputClass}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">— Keine Zuständige —</option>
                {effectiveTeamMembers.map((member) => {
                  const label = memberLabel(member)
                  return label ? (
                    <option key={member.id || member.email} value={label}>{label}</option>
                  ) : null
                })}
              </select>
            </div>
            <div>
              <label htmlFor="t-deadline" className="mb-1.5 block text-[13px] font-medium text-ink">Deadline</label>
              <input id="t-deadline" type="date" className={inputClass} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="t-priority" className="mb-1.5 block text-[13px] font-medium text-ink">Priorität</label>
              <select id="t-priority" className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
              </select>
            </div>
            <div>
              <label htmlFor="t-meeting" className="mb-1.5 block text-[13px] font-medium text-ink">Meeting (optional)</label>
              <select id="t-meeting" className={inputClass} value={meetingId} onChange={(e) => setMeetingId(e.target.value)}>
                <option value="">— Keins —</option>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>{m.title || 'Ohne Titel'}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Wird erstellt…' : 'Erstellen'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
