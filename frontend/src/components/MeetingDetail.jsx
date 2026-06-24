import { useState } from 'react'
import api from '../api/client.js'
import Button from './ui/Button.jsx'
import ErrorAlert from './ui/ErrorAlert.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import { XIcon, SparklesIcon } from './icons.jsx'
import { formatDate, meetingDateOf } from '../lib/meetings.js'
import { getApiErrorMessage } from '../lib/apiErrors.js'


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
  const [followUp, setFollowUp] = useState(null)
  const [loadingFollowUp, setLoadingFollowUp] = useState(false)
  const [qualityScore, setQualityScore] = useState(null)
  const [loadingQualityScore, setLoadingQualityScore] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    if (!transcript.trim()) {
      setError('Bitte füge zuerst ein Protokoll/Transkript ein.')
      return
    }
    setAnalyzing(true)
    setError('')
    try {
      const res = await api.post(`/meetings/${meeting.id}/analyze`, { transcript: transcript.trim() })
      onUpdated(res.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Analyse fehlgeschlagen.'))
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleGenerateFollowUp() {
    setLoadingFollowUp(true)
    setCopied(false)
    setError('')

    try {
      const res = await api.get(`/meetings/${meeting.id}/follow-up`)
      setFollowUp(res.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Follow-up konnte nicht erstellt werden.'))
    } finally {
      setLoadingFollowUp(false)
    }
  }

  async function handleLoadQualityScore() {
    setLoadingQualityScore(true)
    setError('')

    try {
      const res = await api.get(`/meetings/${meeting.id}/quality-score`)
      setQualityScore(res.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Meeting-Score konnte nicht geladen werden.'))
    } finally {
      setLoadingQualityScore(false)
    }
  }

  async function handleCopyFollowUp() {
    if (!followUp) return

    const text = `Betreff: ${followUp.subject}\n\n${followUp.body}`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Follow-up konnte nicht in die Zwischenablage kopiert werden.')
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

          {/* Meeting-Qualitäts-Score */}
          <div className="rounded-card border border-line bg-canvas p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                  Meeting-Qualitäts-Score
                </h4>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  Prüft, ob das Meeting klar dokumentiert und gut nachbereitbar ist.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleLoadQualityScore}
                disabled={loadingQualityScore}
              >
                {loadingQualityScore ? 'Lädt…' : 'Score berechnen'}
              </Button>
            </div>

            {qualityScore && (
              <div className="mt-4 rounded-card border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-ink">{qualityScore.label}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                      {qualityScore.summary}
                    </p>
                  </div>

                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand/10 text-brand">
                    <div className="text-center">
                      <p className="text-[22px] font-bold leading-none">{qualityScore.score}</p>
                      <p className="mt-0.5 text-[11px] font-semibold">/ 100</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${qualityScore.score || 0}%` }}
                  />
                </div>

                <div className="mt-5">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">
                    Meeting-Checkliste
                  </p>

                  <ul className="mt-3 divide-y divide-line rounded-button border border-line bg-canvas">
                    {qualityScore.checks?.map((check, index) => (
                      <li key={index} className="flex items-start gap-3 px-3.5 py-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                            check.passed
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {check.passed ? '✓' : '!'}
                        </span>

                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-ink">{check.label}</p>
                          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                            {check.detail}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {qualityScore.nextBestAction && (
                  <div className="mt-4 rounded-button border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-[13px] font-semibold text-brand">Nächste beste Aktion</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-brand/80">
                      {qualityScore.nextBestAction}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Follow-up-Mail */}
          <div className="rounded-card border border-line bg-canvas p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                  Follow-up-Mail
                </h4>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  Erstelle einen professionellen Entwurf zur Nachbereitung dieses Meetings.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleGenerateFollowUp}
                disabled={loadingFollowUp}
              >
                {loadingFollowUp ? 'Erstellt…' : 'Follow-up erstellen'}
              </Button>
            </div>

            {followUp && (
              <div className="mt-4 space-y-3 rounded-card border border-line bg-surface p-4">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Betreff</p>
                  <p className="mt-1 rounded-button border border-line bg-canvas px-3 py-2 text-[13px] font-medium text-ink">
                    {followUp.subject}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Entwurf</p>
                  <pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap rounded-button border border-line bg-canvas px-3 py-3 text-[13px] leading-relaxed text-ink">
                    {followUp.body}
                  </pre>
                </div>

                <div className="flex justify-end">
                  <Button size="sm" onClick={handleCopyFollowUp}>
                    {copied ? 'Kopiert ✅' : 'In Zwischenablage kopieren'}
                  </Button>
                </div>
              </div>
            )}
          </div>

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
            <div className="mt-3"><ErrorAlert message={error} /></div>
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
