import { useState } from 'react'
import api from '../api/client.js'
import Button from './ui/Button.jsx'
import ErrorAlert from './ui/ErrorAlert.jsx'
import { XIcon, SparklesIcon, FileTextIcon } from './icons.jsx'
import { getApiErrorMessage } from '../lib/apiErrors.js'

const inputClass =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] text-ink ' +
  'placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12'

const MEETING_TEMPLATES = [
  {
    key: 'team',
    label: 'Interne Kanzleibesprechung',
    hint: 'Interne Abstimmung',
    title: 'Interne Kanzleibesprechung',
    description:
      'Agenda:\n- Aktueller Stand im Team\n- Offene Aufgaben\n- Blocker oder Probleme\n- Entscheidungen\n- Nächste Schritte',
  },
  {
    key: 'customer',
    label: 'Mandantenbesprechung',
    hint: 'Mandant / Aktenzeichen',
    title: 'Mandantenbesprechung',
    description:
      'Agenda:\n- Anliegen des Mandanten\n- Aktueller Sachstand\n- Offene Fragen\n- Vereinbarte Aufgaben\n- Nächster Termin / Nachbereitung',
  },
  {
    key: 'sprint',
    label: 'Fristenplanung',
    hint: 'Termine & Fristen',
    title: 'Fristenplanung',
    description:
      'Agenda:\n- Anstehende Fristen\n- Zuständigkeiten\n- Risiken / Abhängigkeiten\n- Priorisierung\n- Nächste Schritte',
  },
  {
    key: 'status',
    label: 'Mandatsstatus',
    hint: 'Fortschritt prüfen',
    title: 'Mandatsstatus',
    description:
      'Agenda:\n- Fortschritt seit dem letzten Termin\n- Erledigte Aufgaben\n- Offene Punkte\n- Risiken\n- Nächste Schritte',
  },
  {
    key: 'sales',
    label: 'Erstberatung',
    hint: 'Bedarf & Erstgespräch',
    title: 'Erstberatung',
    description:
      'Agenda:\n- Anliegen des Mandanten\n- Aktuelle Situation\n- Vorgehen / Lösungsvorschlag\n- Offene Fragen\n- Nächste Schritte',
  },
]

function combineMandantInfo(mandant, aktenzeichen) {
  const cleanMandant = mandant.trim()
  const cleanAktenzeichen = aktenzeichen.trim()

  if (cleanMandant && cleanAktenzeichen) {
    return `${cleanMandant} · Az. ${cleanAktenzeichen}`
  }

  if (cleanMandant) {
    return cleanMandant
  }

  if (cleanAktenzeichen) {
    return `Az. ${cleanAktenzeichen}`
  }

  return ''
}

/** Modal zum Anlegen einer Besprechung (POST /api/meetings). */
export default function CreateMeetingModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mandant, setMandant] = useState('')
  const [aktenzeichen, setAktenzeichen] = useState('')
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
    const combinedProjectName = combineMandantInfo(mandant, aktenzeichen)

    if (!cleanTitle) {
      setError('Titel darf nicht leer sein.')
      setSaving(false)
      return
    }

    try {
      const res = await api.post('/meetings', {
        title: cleanTitle,
        description: cleanDescription || null,
        projectName: combinedProjectName || null,
      })
      onCreated(res.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Besprechung konnte nicht erstellt werden.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-canvas px-4 py-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[34px] border border-line bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-line px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-muted">
                Besprechung erstellen
              </p>
              <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.035em] text-ink">
                Neue Besprechung
              </h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">
                Erstelle eine Mandanten- oder Teambesprechung und lasse MeetingMind daraus Aufgaben, Fristen, Zuständigkeiten und offene Rückfragen erkennen.
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-2xl p-2 text-muted transition hover:bg-soft hover:text-ink"
              aria-label="Schließen"
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-canvas/45 px-6 py-5 sm:px-7">
            <ErrorAlert message={error} />

            <div className="rounded-[26px] border border-line bg-surface p-5 shadow-soft">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Besprechungsvorlage
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    Wähle eine passende Struktur für Agenda, Aufgaben und Nachbereitung.
                  </p>
                </div>

                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <SparklesIcon size={18} />
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {MEETING_TEMPLATES.map((template) => {
                  const active = selectedTemplate === template.key

                  return (
                    <button
                      key={template.key}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className={`rounded-[20px] border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
                        active
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-line bg-canvas/70 text-ink hover:bg-surface'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          active ? 'bg-brand text-white' : 'bg-soft text-muted'
                        }`}>
                          <FileTextIcon size={15} />
                        </span>

                        <span>
                          <span className="block text-[13px] font-semibold">{template.label}</span>
                          <span className={`mt-0.5 block text-[12px] ${
                            active ? 'text-brand/75' : 'text-muted'
                          }`}>
                            {template.hint}
                          </span>
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[26px] border border-line bg-surface p-5 shadow-soft">
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                Besprechungsdaten
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="m-title" className="mb-1.5 block text-[13px] font-medium text-ink">
                    Titel
                  </label>
                  <input
                    id="m-title"
                    className={inputClass}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z. B. Mandantenbesprechung Müller"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="m-mandant" className="mb-1.5 block text-[13px] font-medium text-ink">
                      Mandant
                      <span className="ml-1 font-normal text-muted">(optional)</span>
                    </label>
                    <input
                      id="m-mandant"
                      className={inputClass}
                      value={mandant}
                      onChange={(e) => setMandant(e.target.value)}
                      placeholder="z. B. Müller GmbH"
                    />
                  </div>

                  <div>
                    <label htmlFor="m-aktenzeichen" className="mb-1.5 block text-[13px] font-medium text-ink">
                      Aktenzeichen
                      <span className="ml-1 font-normal text-muted">(optional)</span>
                    </label>
                    <input
                      id="m-aktenzeichen"
                      className={inputClass}
                      value={aktenzeichen}
                      onChange={(e) => setAktenzeichen(e.target.value)}
                      placeholder="z. B. 123/2026"
                    />
                  </div>
                </div>
                <p className="-mt-2 text-[12px] leading-relaxed text-muted">
                  Wichtig für Mandatsakten, Verlauf und spätere Auswertung.
                </p>

                <div>
                  <label htmlFor="m-desc" className="mb-1.5 block text-[13px] font-medium text-ink">
                    Beschreibung / Agenda
                    <span className="ml-1 font-normal text-muted">(optional)</span>
                  </label>
                  <textarea
                    id="m-desc"
                    className={`${inputClass} min-h-[150px] resize-y leading-relaxed`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Worum geht es in dieser Besprechung?"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-5 py-4">
              <p className="text-[13px] font-semibold text-brand">Nach dem Erstellen</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-brand/80">
                Öffne die Besprechungsakte, füge dein Protokoll ein und lasse MeetingMind Zusammenfassung, Aufgaben, Entscheidungen und offene Fragen vorbereiten.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-line bg-surface px-6 py-4 sm:px-7">
            <Button type="button" variant="secondary" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Wird erstellt…' : 'Besprechung erstellen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}