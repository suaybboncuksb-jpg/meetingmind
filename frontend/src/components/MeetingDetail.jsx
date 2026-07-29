import { useEffect, useMemo, useState } from 'react'
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

const TABS = [
  { key: 'overview', label: 'Übersicht' },
  { key: 'analysis', label: 'KI-Analyse' },
  { key: 'transcript', label: 'Transkript' },
  { key: 'followup', label: 'Follow-up' },
]

function priorityLabel(priority) {
  const labels = {
    HIGH: 'Hoch',
    MEDIUM: 'Mittel',
    LOW: 'Niedrig',
  }

  return labels[String(priority || '').toUpperCase()] || 'Mittel'
}

function textOfItem(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  return item.title || item.description || JSON.stringify(item)
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition ${
        active
          ? 'bg-navy text-white shadow-soft'
          : 'text-muted hover:bg-soft hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function InfoTile({ label, value, description }) {
  return (
    <div className="rounded-[22px] border border-line bg-surface px-4 py-3 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-ink">{value}</p>
      {description ? <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{description}</p> : null}
    </div>
  )
}

function TranscriptStat({ label, value }) {
  return (
    <div className="rounded-[18px] border border-line bg-surface px-4 py-3">
      <p className="text-[18px] font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-[11.5px] text-muted">{label}</p>
    </div>
  )
}

function AnalysisResultList({ title, items = [], empty = 'Noch nichts erkannt.', tone = 'default', onCreateTask }) {
  const toneClass = {
    decision: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    question: 'border-amber-100 bg-amber-50 text-amber-800',
    step: 'border-blue-100 bg-blue-50 text-brand',
    default: 'border-line bg-canvas/70 text-ink',
  }[tone] || 'border-line bg-canvas/70 text-ink'

  return (
    <div className="rounded-[24px] border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</p>
          <p className="mt-1 text-[12.5px] text-muted">{items.length} Eintrag/Einträge</p>
        </div>
        <span className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold text-muted">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-line bg-canvas/70 px-4 py-3 text-[12.5px] text-muted">
          {empty}
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((item, index) => {
            const value = textOfItem(item)
            return (
              <li key={`${title}-${index}`} className={`rounded-2xl border px-4 py-3 text-[13px] leading-relaxed ${toneClass}`}>
                <p>{value}</p>

                {onCreateTask ? (
                  <div className="mt-3 flex justify-end">
                    {onCreateTask(value)}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
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
            <li key={`${title}-${index}`} className="rounded-2xl border border-line bg-canvas/70 px-3 py-2 text-[13px] leading-relaxed text-ink">
              {textOfItem(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function MeetingDetail({ meeting, onClose, onUpdated, onTaskCreated }) {
  const [activeTab, setActiveTab] = useState('overview')
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
  const [analysisDetails, setAnalysisDetails] = useState(null)
  const [loadingAnalysisDetails, setLoadingAnalysisDetails] = useState(false)
  const [creatingQuestionTask, setCreatingQuestionTask] = useState('')
  const [questionTaskSuccess, setQuestionTaskSuccess] = useState('')

  const transcriptStats = useMemo(() => getTranscriptStats(transcript), [transcript])
  const transcriptQuality = useMemo(() => getTranscriptQuality(transcript), [transcript])

  const failedAnalysis = String(analysisDetails?.summary || meeting.aiSummary || '')
    .toLowerCase()
    .includes('analyse fehlgeschlagen')

  const analysisStatus = loadingAnalysisDetails
    ? 'Lädt…'
    : failedAnalysis
      ? 'Fehlgeschlagen'
      : (analysisDetails?.analysisStatus || meeting.status || 'Offen')

  useEffect(() => {
    let cancelled = false

    async function loadAnalysisDetails() {
      setLoadingAnalysisDetails(true)

      try {
        const res = await api.get(`/meetings/${meeting.id}/analysis`)

        if (!cancelled) {
          setAnalysisDetails(res.data)
        }
      } catch {
        if (!cancelled) {
          setAnalysisDetails(null)
        }
      } finally {
        if (!cancelled) {
          setLoadingAnalysisDetails(false)
        }
      }
    }

    loadAnalysisDetails()

    return () => {
      cancelled = true
    }
  }, [meeting.id, meeting.status, meeting.aiSummary])

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
      setActiveTab('analysis')
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
      setActiveTab('analysis')
    } catch (err) {
      onUpdated?.({ ...meeting, status: 'ANALYSIS_FAILED' })
      setError(getApiErrorMessage(err, 'Analyse fehlgeschlagen. Bitte prüfe API-Key, Transkript und KI-Verbindung.'))
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleCreateTaskFromQuestion(question) {
    const cleanQuestion = String(question || '').trim()

    if (!cleanQuestion) {
      setError('Offene Frage ist leer.')
      return
    }

    const taskTitle = cleanQuestion.endsWith('?')
      ? `Klären: ${cleanQuestion.slice(0, -1)}`
      : `Klären: ${cleanQuestion}`

    setCreatingQuestionTask(cleanQuestion)
    setQuestionTaskSuccess('')
    setError('')

    try {
      const res = await api.post('/tasks', {
        title: taskTitle,
        assignee: null,
        deadline: null,
        priority: 'MEDIUM',
        meetingId: meeting.id,
      })

      onTaskCreated?.(res.data)
      setQuestionTaskSuccess(cleanQuestion)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Aus der offenen Frage konnte keine Aufgabe erstellt werden.'))
    } finally {
      setCreatingQuestionTask('')
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
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/40 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[78vh] min-h-[620px] w-full max-w-6xl flex-col overflow-hidden rounded-[34px] border border-line bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-line bg-surface/95 px-6 py-5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-muted">
                Meeting Command Center
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="truncate text-[26px] font-semibold tracking-[-0.04em] text-ink">
                  {meeting.title || 'Ohne Titel'}
                </h2>
                <StatusBadge status={meeting.status} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                <span>{formatDate(meetingDateOf(meeting))}</span>
                {meeting.projectName ? (
                  <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[12px] font-semibold text-brand">
                    Projekt / Kunde: {meeting.projectName}
                  </span>
                ) : (
                  <span className="rounded-full bg-soft px-2.5 py-1 text-[12px] font-semibold text-muted">
                    Kein Projekt hinterlegt
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-2xl p-2 text-muted transition hover:bg-soft hover:text-ink"
              aria-label="Schließen"
            >
              <XIcon size={20} />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-[22px] border border-line bg-canvas/70 p-1.5">
            {TABS.map((tab) => (
              <TabButton
                key={tab.key}
                active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-canvas/45 px-6 py-6">
          <div className="mx-auto max-w-5xl space-y-5">
            <ErrorAlert message={error} />

            {activeTab === 'overview' && (
              <div className="space-y-5">
                <section className="rounded-[28px] border border-line bg-surface p-6 shadow-soft">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Überblick
                      </p>
                      <h3 className="mt-2 text-[22px] font-semibold tracking-tight text-ink">
                        Aus diesem Meeting entsteht deine Nachbereitung.
                      </h3>
                      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
                        Bereinige das Transkript, erstelle eine KI-Vorschau und überführe Ergebnisse in Aufgaben, Entscheidungen und Follow-up.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button variant="secondary" onClick={() => setActiveTab('transcript')}>
                        Transkript öffnen
                      </Button>
                      <Button icon={SparklesIcon} onClick={() => setActiveTab('analysis')}>
                        Analyse ansehen
                      </Button>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                  <InfoTile label="Analyse" value={analysisStatus} description="Status der KI-Nachbereitung." />
                  <InfoTile label="Transkript" value={`${transcriptStats.words} Wörter`} description={`${transcriptStats.lines} Zeilen, ${transcriptStats.speakerCount} Sprecher.`} />
                  <InfoTile label="Qualität" value={`${transcriptQuality.score} %`} description={transcriptQuality.label} />
                  <InfoTile label="Projekt" value={meeting.projectName || '—'} description="Für Projektakte und Verlauf." />
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <section className="rounded-[28px] border border-line bg-surface p-5 shadow-soft">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                      Nächster sinnvoller Schritt
                    </p>
                    <h3 className="mt-2 text-[18px] font-semibold text-ink">
                      {transcript.trim() ? 'KI-Vorschau erstellen' : 'Transkript einfügen'}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">
                      {transcript.trim()
                        ? 'Das Transkript ist vorhanden. Erstelle zuerst eine Vorschau, bevor du Analyse und Aufgaben speicherst.'
                        : 'Füge ein Meeting-Protokoll ein, damit MeetingMind Aufgaben, Entscheidungen und offene Fragen erkennen kann.'}
                    </p>
                    <div className="mt-4">
                      <Button onClick={() => setActiveTab('transcript')}>
                        Zum Transkript
                      </Button>
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-line bg-surface p-5 shadow-soft">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                      KI-Ergebnisse
                    </p>
                    <h3 className="mt-2 text-[18px] font-semibold text-ink">
                      {analysisDetails?.summary || meeting.aiSummary ? 'Analyse vorhanden' : 'Noch keine stabile Analyse'}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">
                      Entscheidungen, offene Fragen und nächste Schritte erscheinen im Tab „KI-Analyse“.
                    </p>
                    <div className="mt-4">
                      <Button variant="secondary" onClick={() => setActiveTab('analysis')}>
                        Analyse öffnen
                      </Button>
                    </div>
                  </section>
                </div>

                <section className="rounded-[28px] border border-line bg-surface p-5 shadow-soft">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                    MeetingMind Workflow
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <div className="rounded-2xl border border-line bg-canvas/70 px-4 py-4">
                      <p className="text-[13px] font-semibold text-ink">1. Transkript vorbereiten</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                        Protokoll bereinigen und Sprecher, Aufgaben und Deadlines klar erfassen.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-line bg-canvas/70 px-4 py-4">
                      <p className="text-[13px] font-semibold text-ink">2. KI-Vorschau prüfen</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                        Zusammenfassung, Aufgaben, Entscheidungen und offene Fragen kontrollieren.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-line bg-canvas/70 px-4 py-4">
                      <p className="text-[13px] font-semibold text-ink">3. Umsetzung starten</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                        Aufgaben zuweisen, Follow-up erstellen und Projektakte aktuell halten.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-5">
                {analysisPreview && (
                  <section className="rounded-[28px] border border-brand/20 bg-surface p-5 shadow-soft">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand">
                          Analyse-Vorschau
                        </p>
                        <h3 className="mt-2 text-[20px] font-semibold text-ink">
                          Prüfe die KI-Ergebnisse vor dem Speichern.
                        </h3>
                        <p className="mt-2 text-[13px] leading-relaxed text-muted">
                          Wenn die Vorschau passt, kannst du sie übernehmen. Danach werden Zusammenfassung und Aufgaben gespeichert.
                        </p>
                      </div>

                      <Button onClick={handleApplyAnalysisPreview} disabled={applyingPreview}>
                        {applyingPreview ? 'Übernimmt…' : 'Analyse übernehmen'}
                      </Button>
                    </div>

                    {analysisPreview.summary ? (
                      <div className="mt-5 rounded-2xl border border-line bg-canvas/70 px-4 py-3">
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Zusammenfassung</p>
                        <p className="mt-2 text-[13px] leading-relaxed text-ink">{analysisPreview.summary}</p>
                      </div>
                    ) : null}

                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <PreviewList title="Erkannte Aufgaben" items={analysisPreview.actionItems || []} />
                      <PreviewList title="Entscheidungen" items={analysisPreview.decisions || []} />
                      <PreviewList title="Offene Fragen" items={analysisPreview.questions || []} />
                      <PreviewList title="Nächste Schritte" items={analysisPreview.nextSteps || []} />
                    </div>
                  </section>
                )}

                <section className="rounded-[28px] border border-line bg-surface p-5 shadow-soft">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Gespeicherte Analyse
                      </p>
                      <h3 className="mt-2 text-[20px] font-semibold text-ink">
                        Zusammenfassung, Entscheidungen und Aufgaben
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-muted">
                        Status: {analysisStatus}
                      </p>
                    </div>

                    <Button variant="secondary" onClick={() => setActiveTab('transcript')}>
                      Neue Analyse starten
                    </Button>
                  </div>

                  <div className="mt-5 rounded-2xl border border-line bg-canvas/70 px-4 py-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">KI-Zusammenfassung</p>
                    {analysisDetails?.summary || meeting.aiSummary ? (
                      <p className="mt-2 text-[13px] leading-relaxed text-ink">
                        {analysisDetails?.summary || meeting.aiSummary}
                      </p>
                    ) : (
                      <p className="mt-2 text-[12.5px] text-muted">Noch keine Analyse vorhanden.</p>
                    )}
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <AnalysisResultList
                    title="Entscheidungen"
                    items={analysisDetails?.decisions || []}
                    empty="Noch keine Entscheidungen dokumentiert."
                    tone="decision"
                  />

                  <AnalysisResultList
                    title="Offene Fragen"
                    items={analysisDetails?.questions || []}
                    empty="Keine offenen Fragen erkannt."
                    tone="question"
                    onCreateTask={(question) => {
                      const isCreating = creatingQuestionTask === question
                      const wasCreated = questionTaskSuccess === question

                      return (
                        <Button
                          size="sm"
                          variant={wasCreated ? 'secondary' : 'primary'}
                          onClick={() => handleCreateTaskFromQuestion(question)}
                          disabled={isCreating || wasCreated}
                        >
                          {isCreating ? 'Wird erstellt…' : wasCreated ? 'Aufgabe erstellt ✅' : 'Als Aufgabe anlegen'}
                        </Button>
                      )
                    }}
                  />

                  <AnalysisResultList
                    title="Nächste Schritte"
                    items={analysisDetails?.nextSteps || []}
                    empty="Noch keine nächsten Schritte erkannt."
                    tone="step"
                  />

                  <AnalysisResultList
                    title="Wichtige Punkte"
                    items={analysisDetails?.keyPoints || []}
                    empty="Noch keine wichtigen Punkte erkannt."
                  />

                  <div className="lg:col-span-2">
                    <AnalysisResultList
                      title="Erkannte Aufgaben aus Analyse"
                      items={analysisDetails?.actionItems || []}
                      empty="Noch keine Aufgaben aus der Analyse gespeichert."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="space-y-5">
                <section className="rounded-[28px] border border-line bg-surface p-6 shadow-soft">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Transkript-Studio
                      </p>
                      <h3 className="mt-2 text-[22px] font-semibold tracking-tight text-ink">
                        Bereite dein Meeting-Protokoll für die KI-Analyse vor.
                      </h3>
                      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
                        Je klarer Sprecher, Aufgaben und Deadlines benannt sind, desto besser werden Zusammenfassung und Action Items.
                      </p>
                    </div>

                    <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${transcriptQualityBadgeClass(transcriptQuality.level)}`}>
                      {transcriptQuality.score} % · {transcriptQuality.label}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <TranscriptStat label="Wörter" value={transcriptStats.words} />
                    <TranscriptStat label="Zeilen" value={transcriptStats.lines} />
                    <TranscriptStat label="Sprecher" value={transcriptStats.speakerCount} />
                    <TranscriptStat label="Min. Lesezeit" value={transcriptStats.estimatedMinutes} />
                  </div>

                  <div className="mt-5 rounded-2xl border border-line bg-canvas/70 px-4 py-3">
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
                    className="mt-5 min-h-[280px] w-full resize-y rounded-[22px] border border-line bg-surface px-4 py-4 text-[14px] leading-relaxed text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/12"
                  />

                  <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
                </section>

                <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-5 py-4">
                  <p className="text-[13px] font-semibold text-brand">Tipp für bessere Aufgabenanalyse</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-brand/80">
                    Die besten Ergebnisse entstehen, wenn Sprecher, Verantwortliche und Deadlines klar genannt werden:
                    „Name: Ich übernehme Aufgabe X bis Datum Y.“
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'followup' && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <section className="rounded-[28px] border border-line bg-surface p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Meeting-Qualitäts-Score
                      </p>
                      <h3 className="mt-2 text-[18px] font-semibold text-ink">
                        Wie gut ist dieses Meeting nachbereitbar?
                      </h3>
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

                  {qualityScore ? (
                    <div className="mt-5 rounded-[24px] border border-line bg-canvas/70 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-ink">{qualityScore.label}</p>
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

                      {qualityScore.nextBestAction ? (
                        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                          <p className="text-[13px] font-semibold text-brand">Nächste beste Aktion</p>
                          <p className="mt-1 text-[12.5px] leading-relaxed text-brand/80">
                            {qualityScore.nextBestAction}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-line bg-canvas/70 px-4 py-4">
                      <p className="text-[13px] font-semibold text-ink">Noch kein Score berechnet</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                        Berechne den Score, um zu sehen, ob dieses Meeting klar dokumentiert und gut nachbereitbar ist.
                      </p>
                    </div>
                  )}
                </section>

                <section className="rounded-[28px] border border-line bg-surface p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
                        Follow-up-Mail
                      </p>
                      <h3 className="mt-2 text-[18px] font-semibold text-ink">
                        Professionelle Nachbereitung erstellen
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-muted">
                        Erstelle einen E-Mail-Entwurf zur Nachbereitung dieses Meetings.
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

                  {followUp ? (
                    <div className="mt-5 space-y-3 rounded-[24px] border border-line bg-canvas/70 p-4">
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Betreff</p>
                        <p className="mt-1 rounded-2xl border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink">
                          {followUp.subject}
                        </p>
                      </div>

                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Entwurf</p>
                        <pre className="mt-1 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-line bg-surface px-3 py-3 text-[13px] leading-relaxed text-ink">
                          {followUp.body}
                        </pre>
                      </div>

                      <div className="flex justify-end">
                        <Button size="sm" onClick={handleCopyFollowUp}>
                          {copied ? 'Kopiert ✅' : 'In Zwischenablage kopieren'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-line bg-canvas/70 px-4 py-4">
                      <p className="text-[13px] font-semibold text-ink">Noch kein Follow-up erstellt</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                        Erstelle aus der Meeting-Zusammenfassung einen professionellen E-Mail-Entwurf für dein Team oder deinen Kunden.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
