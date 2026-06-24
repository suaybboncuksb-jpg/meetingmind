import { useState } from 'react'
import api from '../api/client.js'
import Button from './ui/Button.jsx'
import ErrorAlert from './ui/ErrorAlert.jsx'
import { XIcon } from './icons.jsx'
import { getApiErrorMessage } from '../lib/apiErrors.js'

const inputClass =
  'w-full rounded-button border border-line bg-surface px-3.5 py-3 text-[15px] text-ink ' +
  'placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12'

const MEETING_TEMPLATES = [
  {
    key: 'team',
    label: 'Teammeeting',
    title: 'Teammeeting',
    description:
      'Agenda:\n- Aktueller Stand im Team\n- Offene Aufgaben\n- Blocker oder Probleme\n- Entscheidungen\n- Nächste Schritte',
  },
  {
    key: 'customer',
    label: 'Kundenmeeting',
    title: 'Kundenmeeting',
    description:
      'Agenda:\n- Anliegen des Kunden\n- Aktueller Projektstand\n- Offene Fragen\n- Vereinbarte Aufgaben\n- Nächster Termin / Follow-up',
  },
  {
    key: 'sprint',
    label: 'Sprint Planning',
    title: 'Sprint Planning',
    description:
      'Agenda:\n- Ziel des Sprints\n- Geplante Aufgaben\n- Verantwortlichkeiten\n- Risiken / Abhängigkeiten\n- Definition of Done',
  },
  {
    key: 'status',
    label: 'Projektstatus',
    title: 'Projektstatus',
    description:
      'Agenda:\n- Fortschritt seit dem letzten Termin\n- Erledigte Aufgaben\n- Offene Punkte\n- Risiken\n- Nächste Schritte',
  },
  {
    key: 'sales',
    label: 'Vertriebsgespräch',
    title: 'Vertriebsgespräch',
    description:
      'Agenda:\n- Bedarf des Kunden\n- Aktuelle Situation\n- Angebot / Lösungsvorschlag\n- Einwände oder offene Fragen\n- Nächste Schritte',
  },
]

/** Modal zum Anlegen eines Meetings (POST /api/meetings). */
export default function CreateMeetingModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectName, setProjectName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function applyTemplate(template) {
    setSelectedTemplate(template.key)

    if (!title.trim()) {
      setTitle(template.title)
    }

    if (!description.trim()) {
      setDescription(template.description)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const cleanTitle = title.trim()
    const cleanDescription = description.trim()
    const cleanProjectName = projectName.trim()

    if (!cleanTitle) {
      setError('Meeting-Titel darf nicht leer sein.')
      setSaving(false)
      return
    }

    try {
      const res = await api.post('/meetings', {
        title: cleanTitle,
        description: cleanDescription || null,
        projectName: cleanProjectName || null,
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
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-ink">Neues Meeting</h2>
            <p className="mt-1 text-[13px] text-muted">
              Wähle optional eine Vorlage, um schneller zu starten.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-soft hover:text-ink"
            aria-label="Schließen"
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <ErrorAlert message={error} />

          <div>
            <label className="mb-2 block text-[13px] font-medium text-ink">
              Meeting-Vorlage
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MEETING_TEMPLATES.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className={`rounded-button border px-3.5 py-3 text-left text-[13px] font-semibold transition ${
                    selectedTemplate === template.key
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-line bg-surface text-ink hover:bg-soft'
                  }`}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

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
            <label htmlFor="m-project" className="mb-1.5 block text-[13px] font-medium text-ink">Projekt / Kunde (optional)</label>
            <input
              id="m-project"
              className={inputClass}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="z. B. Müller GmbH oder Website-Relaunch"
            />
          </div>

          <div>
            <label htmlFor="m-desc" className="mb-1.5 block text-[13px] font-medium text-ink">Beschreibung / Agenda (optional)</label>
            <textarea
              id="m-desc"
              className={`${inputClass} min-h-[140px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Worum geht es in diesem Meeting?"
            />
          </div>

          </div>

          <div className="flex justify-end gap-2 border-t border-line bg-surface px-6 py-4">
            <Button type="button" variant="secondary" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Wird erstellt…' : 'Erstellen'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
