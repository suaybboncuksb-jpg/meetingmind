import { useState } from 'react'
import api from '../api/client.js'
import Button from './ui/Button.jsx'
import ErrorAlert from './ui/ErrorAlert.jsx'
import { XIcon } from './icons.jsx'
import { getApiErrorMessage } from '../lib/apiErrors.js'

const inputClass =
  'w-full rounded-button border border-line bg-surface px-3.5 py-3 text-[15px] text-ink ' +
  'placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12'

/** Modal zum Anlegen eines Meetings (POST /api/meetings). */
export default function CreateMeetingModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const cleanTitle = title.trim()
    const cleanDescription = description.trim()

    if (!cleanTitle) {
      setError('Meeting-Titel darf nicht leer sein.')
      setSaving(false)
      return
    }

    try {
      const res = await api.post('/meetings', {
        title: cleanTitle,
        description: cleanDescription || null,
      })
      onCreated(res.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Meeting konnte nicht erstellt werden.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">Neues Meeting</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-soft hover:text-ink"
            aria-label="Schließen"
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorAlert message={error} />
          <div>
            <label htmlFor="m-title" className="mb-1.5 block text-[13px] font-medium text-ink">Titel</label>
            <input
              id="m-title"
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Sprint Planning KW 25"
              required
            />
          </div>
          <div>
            <label htmlFor="m-desc" className="mb-1.5 block text-[13px] font-medium text-ink">Beschreibung (optional)</label>
            <textarea
              id="m-desc"
              className={`${inputClass} min-h-[88px] resize-none`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Worum geht es in diesem Meeting?"
            />
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
