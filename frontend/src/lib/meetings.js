/** Gemeinsame Helfer rund um Meetings (Datum, Statistiken). */

export function meetingDateOf(meeting) {
  return meeting?.meetingDate || meeting?.createdAt || null
}

export function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function isAnalyzed(meeting) {
  return meeting?.status === 'ANALYZED' || Boolean(meeting?.aiSummary)
}

/** Anzahl erkannter Aufgaben (sobald die Analyse strukturierte Tasks liefert). */
export function taskCountOf(meeting) {
  if (Array.isArray(meeting?.tasks)) return meeting.tasks.length
  if (Array.isArray(meeting?.analysis?.actionItems)) return meeting.analysis.actionItems.length
  return 0
}

export function deriveStats(meetings = [], tasks = []) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)) // Montag
  weekStart.setHours(0, 0, 0, 0)

  return {
    total: meetings.length,
    analyzed: meetings.filter(isAnalyzed).length,
    openTasks: tasks.filter((t) => t.status !== 'DONE' && !t.completed && !t.done).length,
    thisWeek: meetings.filter((m) => {
      const d = meetingDateOf(m)
      return d && new Date(d) >= weekStart
    }).length,
  }
}

export function sortByDateDesc(meetings = []) {
  return [...meetings].sort(
    (a, b) => new Date(meetingDateOf(b) || 0) - new Date(meetingDateOf(a) || 0),
  )
}
