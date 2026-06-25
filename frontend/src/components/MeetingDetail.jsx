import { useMemo, useState } from 'react'
import api from '../api/client.js'
import Button from './ui/Button.jsx'
import ErrorAlert from './ui/ErrorAlert.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import { XIcon, SparklesIcon } from './icons.jsx'
import { formatDate, meetingDateOf } from '../lib/meetings.js'
import { getApiErrorMessage } from '../lib/apiErrors.js'
import {
  cleanTranscript,
  getTranscriptQuality,
  getTranscriptStats,
  transcriptQualityBadgeClass,
} from '../lib/transcriptionStudio.js'


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



function PreviewList({ title, items = [], empty = 'Keine Einträge erkannt.' }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">{title}</p>

      {items.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-muted">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="rounded-button border border-line bg-canvas px-3 py-2 text-[13px] leading-relaxed text-ink">
              {typeof item === 'string' ? item : item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function priorityLabel(priority) {
  const labels = {
    HIGH: 'Hoch',
    MEDIUM: 'Mittel',
    LOW: 'Niedrig',
  }

  return labels[String(priority || '').toUpperCase()] || 'Mittel'
}

function TranscriptStat({ label, value }) {
  return (
    <div className="rounded-button border border-line bg-surface px-3 py-2">
      <p className="text-[16px] font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-[11.5px] text-muted">{label}</p>
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
  const [analysisPreview, setAnalysisPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [applyingPreview, setApplyingPreview] = useState(false)

  const transcriptStats = useMemo(() => getTranscriptStats(transcript), [transcript])
  const transcriptQuality = useMemo(() => getTranscriptQuality(transcript), [transcript])

  function handleCleanTranscript(reduceFillers = false) {
    if (!transcript.trim()) {
      setError('Bitte füge zuerst ein Protokoll/Transkript ein.')
      return
    }

    const cleaned = cleanTranscript(transcript, { reduceFillers })
    setTranscript(cleaned)
    setError('')
  }


  async function handleCreateAnalysisPreview() {
    if (!transcript.trim()) {
      setError('Bitte füge zuerst ein Protokoll/Transkript ein.')
      return
    }

    const preparedTranscript = cleanTranscript(transcript, { reduceFillers: false })

    setTranscript(preparedTranscript)
    setLoadingPreview(true)
    setAnalysisPreview(null)
    setError('')

    try {
      const res = await api.post(`/meetings/${meeting.id}/analysis-preview`, {
        transcript: preparedTranscript.trim(),
      })

      setAnalysisPreview(res.data)
    } catch (err) {
      onUpdated?.({ ...meeting, status: 'ANALYSIS_FAILED' })
      setError(getApiErrorMessage(err, 'Analyse-Vorschau fehlgeschlagen. Bitte prüfe API-Key, Transkript und KI-Verbindung.'))
    } finally {
      setLoadingPreview(false)
    }
  }

  async function handleApplyAnalysisPreview() {
    if (!analysisPreview) return

    setApplyingPreview(true)
    setError('')

    try {
      const res = await api.post(`/meetings/${meeting.id}/analysis-preview/apply`, analysisPreview)
      setAnalysisPreview(null)
      onUpdated(res.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Analyse-Vorschau konnte nicht übernommen werden.'))
    } finally {
      setApplyingPreview(false)
    }
  }

  async function handleAnalyze() {
    if (!transcript.trim()) {
      setError('Bitte füge zuerst ein Protokoll/Transkript ein.')
      return
    }
    const preparedTranscript = cleanTranscript(transcript, { reduceFillers: false })

    setTranscript(preparedTranscript)
    setAnalyzing(true)
    setError('')

    try {
      const res = await api.post(`/meetings/${meeting.id}/analyze`, { transcript: preparedTranscript.trim() })
      onUpdated(res.data)
    } catch (err) {
      onUpdated?.({ ...meeting, status: 'ANALYSIS_FAILED' })
      setError(getApiErrorMessage(err, 'Analyse fehlgeschlagen. Bitte prüfe API-Key, Transkript und KI-Verbindung.'))
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
            {meeting.projectName ? (
              <p className="mt-2 inline-flex rounded-full bg-brand/10 px-2.5 py-1 text-[12px] font-semibold text-brand">
                Projekt / Kunde: {meeting.projectName}
              </p>
            ) : null}
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

          {/* Transkriptions-Studio + Analyse */}
          <div className="rounded-card border border-line bg-canvas p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                  Transkriptions-Studio
                </h4>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  Bereinige und strukturiere dein Meeting-Transkript, bevor es an die KI-Analyse geht.
                </p>
              </div>

              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${transcriptQualityBadgeClass(transcriptQuality.level)}`}>
                {transcriptQuality.score} % · {transcriptQuality.label}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <TranscriptStat label="Wörter" value={transcriptStats.words} />
              <TranscriptStat label="Zeilen" value={transcriptStats.lines} />
              <TranscriptStat label="Sprecher" value={transcriptStats.speakerCount} />
              <TranscriptStat label="Min. Lesezeit" value={transcriptStats.estimatedMinutes} />
            </div>

            <div className="mt-4 rounded-button border border-line bg-surface px-4 py-3">
              <p className="text-[13px] font-semibold text-ink">{transcriptQuality.summary}</p>

              {transcriptQuality.issues.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {transcriptQuality.issues.slice(0, 3).map((issue) => (
                    <li key={issue} className="text-[12.5px] leading-relaxed text-muted">
                      • {issue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                  Das Transkript ist bereit für eine bessere Analyse von Aufgaben, Entscheidungen und offenen Fragen.
                </p>
              )}
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={`Füge hier dein Meeting-Protokoll oder Transkript ein…

Beispiel:
Suayb: Wir müssen das Angebot bis Freitag vorbereiten.
Ayşe: Ich übernehme die Prüfung der Zahlen.
Mehmet: Ich kläre die technischen Fragen bis Mittwoch.`}
              className="mt-4 min-h-[220px] w-full resize-y rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/12"
            />

            <div className="mt-3"><ErrorAlert message={error} /></div>

            {analysisPreview && (
              <div className="mt-4 rounded-card border border-brand/15 bg-surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-ink">Analyse-Vorschau</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                      Prüfe die erkannten Inhalte, bevor sie als Meeting-Analyse und Aufgaben gespeichert werden.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleApplyAnalysisPreview}
                    disabled={applyingPreview}
                  >
                    {applyingPreview ? 'Übernimmt…' : 'Analyse übernehmen'}
                  </Button>
                </div>

                {analysisPreview.summary ? (
                  <div className="mt-4 rounded-button border border-line bg-canvas px-3 py-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Zusammenfassung</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink">{analysisPreview.summary}</p>
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Erkannte Aufgaben</p>

                    {analysisPreview.actionItems?.length ? (
                      <ul className="mt-2 space-y-2">
                        {analysisPreview.actionItems.map((task, index) => (
                          <li key={`${task.title}-${index}`} className="rounded-button border border-line bg-canvas px-3 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[13px] font-semibold text-ink">{task.title}</p>
                              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                                {priorityLabel(task.priority)}
                              </span>
                            </div>
                            <p className="mt-1 text-[12.5px] text-muted">
                              {task.assignee ? `Zuständig: ${task.assignee}` : 'Kein Verantwortlicher'}
                              {task.deadline ? ` · Deadline: ${task.deadline}` : ' · Keine Deadline'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-[12.5px] text-muted">Keine Aufgaben erkannt.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <PreviewList title="Entscheidungen" items={analysisPreview.decisions || []} />
                    <PreviewList title="Offene Fragen" items={analysisPreview.questions || []} />
                    <PreviewList title="Nächste Schritte" items={analysisPreview.nextSteps || []} />
                    <PreviewList title="Wichtige Punkte" items={analysisPreview.keyPoints || []} />
                  </div>
                </div>
              </div>
            )}


            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCleanTranscript(false)}
                  disabled={!transcript.trim() || analyzing}
                >
                  Transkript bereinigen
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCleanTranscript(true)}
                  disabled={!transcript.trim() || analyzing}
                >
                  Füllwörter reduzieren
                </Button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  icon={SparklesIcon}
                  onClick={handleCreateAnalysisPreview}
                  disabled={loadingPreview || analyzing}
                >
                  {loadingPreview ? 'Erstellt Vorschau…' : 'Vorschau erstellen'}
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleAnalyze}
                  disabled={analyzing || loadingPreview}
                >
                  {analyzing ? 'Analysiere…' : 'Direkt analysieren'}
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-button border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-[13px] font-semibold text-brand">Tipp für bessere Aufgabenanalyse</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-brand/80">
                Die besten Ergebnisse entstehen, wenn Sprecher, Verantwortliche und Deadlines klar genannt werden:
                „Name: Ich übernehme Aufgabe X bis Datum Y.“
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
