import { useState } from 'react'
import axios from 'axios'
import Button from './ui/Button.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import { XIcon, SparklesIcon } from './icons.jsx'
import { formatDate, meetingDateOf } from '../lib/meetings.js'

const API = 'http://localhost:8080/api'

/** Labeled Section mit Inhalt oder ruhigem Empty-State. */
function Section({ title, children, empty }) {
  return (
    <div>
      <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</h4>
      <div className="mt-2 text-[14px] leading-relaxed text-ink">
        {children || <p className="text-[13px] text-muted">{empty}</p>}
      </div>
    </div>
  )
}

/**
 * MeetingDetail – Slide-over mit vorbereiteter Struktur für die Analyse.
 * KI-Analyse ist gegen den bestehenden Backend-Endpoint verdrahtet.
 */
export default function MeetingDetail({ meeting, onClose, onUpdated }) {
  const [transcript, setTranscript] = useState(meeting.transcript || '')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    if (!transcript.trim()) {
      setError('Bitte füge zuerst ein Protokoll/Transkript ein.')
      return
    }
    setAnalyzing(true)
    setError('')
    try {
      const res = await axios.post(`${API}/meetings/${meeting.id}/analyze`, { transcript })
      onUpdated(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Analyse fehlgeschlagen.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-navy/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto border-l border-line bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-surface/90 px-6 py-5 backdrop-blur-md">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="truncate text-[18px] font-semibold tracking-tight text-ink">
                {meeting.title || 'Ohne Titel'}
              </h2>
              <StatusBadge status={meeting.status} />
            </div>
            <p className="mt-1 text-[13px] text-muted">{formatDate(meetingDateOf(meeting))}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-soft hover:text-ink"
            aria-label="Schließen"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="space-y-7 px-6 py-6">
          <Section title="KI-Zusammenfassung" empty="Noch keine Analyse vorhanden.">
            {meeting.aiSummary ? <p>{meeting.aiSummary}</p> : null}
          </Section>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Section title="Erkannte Aufgaben" empty="Wird nach der Analyse angezeigt." />
            <Section title="Verantwortliche" empty="Wird nach der Analyse angezeigt." />
            <Section title="Deadlines" empty="Wird nach der Analyse angezeigt." />
            <Section title="Entscheidungen" empty="Wird nach der Analyse angezeigt." />
          </div>

          <Section title="Offene Fragen" empty="Wird nach der Analyse angezeigt." />

          {/* Protokoll / Transkript + Analyse */}
          <div className="rounded-card border border-line bg-canvas p-5">
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
              Protokoll / Transkript
            </h4>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Füge hier das Meeting-Protokoll oder Transkript ein…"
              className="mt-3 min-h-[140px] w-full resize-y rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/12"
            />
            {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
            <div className="mt-3 flex justify-end">
              <Button icon={SparklesIcon} onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? 'Analysiere…' : 'KI-Analyse starten'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
