const FILLER_WORDS = [
  'ähm',
  'äh',
  'hm',
  'hmm',
  'sozusagen',
  'quasi',
  'halt',
]

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function removeFillerWords(line) {
  return FILLER_WORDS.reduce((current, filler) => {
    const pattern = new RegExp(`(^|\\s)${escapeRegExp(filler)}(?=\\s|[,.!?;:]|$)`, 'gi')
    return current.replace(pattern, ' ')
  }, line)
}

function normalizeSpeakerSyntax(line) {
  const trimmed = line.trim()

  const dashSpeaker = trimmed.match(/^([\p{L} .-]{2,32})\s[-–]\s(.+)$/u)
  if (dashSpeaker) {
    return `${dashSpeaker[1].trim()}: ${dashSpeaker[2].trim()}`
  }

  const colonSpeaker = trimmed.match(/^([\p{L} .-]{2,32})\s*:\s*(.+)$/u)
  if (colonSpeaker) {
    return `${colonSpeaker[1].trim()}: ${colonSpeaker[2].trim()}`
  }

  return trimmed
}

function normalizeLine(line, { reduceFillers = false } = {}) {
  let cleaned = String(line || '')
    .replace(/\r/g, '')
    .replace(/\[[0-9:. -]+\]/g, '')
    .replace(/^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?\s*[-–]?\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (reduceFillers) {
    cleaned = removeFillerWords(cleaned)
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.!?;:])/g, '$1')
      .trim()
  }

  return normalizeSpeakerSyntax(cleaned)
}

function isSpeakerLine(line) {
  return /^[\p{L} .-]{2,32}:\s+\S/u.test(String(line || '').trim())
}

function extractSpeakers(text) {
  const speakers = new Set()

  String(text || '')
    .split('\n')
    .forEach((line) => {
      const match = line.trim().match(/^([\p{L} .-]{2,32}):\s+\S/u)
      if (match) speakers.add(match[1].trim())
    })

  return Array.from(speakers)
}

export function cleanTranscript(value, options = {}) {
  const rawLines = String(value || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => normalizeLine(line, options))
    .filter(Boolean)

  const result = []

  rawLines.forEach((line) => {
    if (isSpeakerLine(line) && result.length > 0 && result[result.length - 1] !== '') {
      result.push('')
    }

    result.push(line)
  })

  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function getTranscriptStats(value) {
  const text = String(value || '').trim()
  const words = text ? text.split(/\s+/).filter(Boolean) : []
  const lines = text ? text.split('\n').filter((line) => line.trim()) : []
  const speakers = extractSpeakers(text)

  return {
    characters: text.length,
    words: words.length,
    lines: lines.length,
    speakers,
    speakerCount: speakers.length,
    estimatedMinutes: Math.max(1, Math.ceil(words.length / 150)),
    hasSpeakerStructure: speakers.length > 0,
  }
}

export function getTranscriptQuality(value) {
  const stats = getTranscriptStats(value)
  const text = String(value || '').toLowerCase()

  if (!stats.words) {
    return {
      score: 0,
      label: 'Kein Transkript',
      summary: 'Füge zuerst ein Protokoll oder Transkript ein.',
      issues: ['Kein Text vorhanden.'],
      level: 'critical',
    }
  }

  let score = 100
  const issues = []

  if (stats.words < 40) {
    score -= 30
    issues.push('Das Transkript ist sehr kurz. Die KI kann dadurch weniger zuverlässig Aufgaben erkennen.')
  }

  if (!stats.hasSpeakerStructure) {
    score -= 25
    issues.push('Es gibt keine erkennbare Sprecherstruktur wie „Name: Aussage“.')
  }

  const hasActionSignals = [
    'muss',
    'soll',
    'bis',
    'deadline',
    'zuständig',
    'übernimmt',
    'nächste schritte',
    'todo',
    'aufgabe',
  ].some((signal) => text.includes(signal))

  if (!hasActionSignals) {
    score -= 20
    issues.push('Es sind wenige klare Aufgaben-Signale erkennbar. Formulierungen wie „X übernimmt Y bis Freitag“ helfen der Analyse.')
  }

  if (stats.lines < 3) {
    score -= 10
    issues.push('Das Transkript ist kaum strukturiert. Absätze oder Sprecherzeilen verbessern die Lesbarkeit.')
  }

  const finalScore = Math.max(0, Math.min(100, score))

  if (finalScore >= 85) {
    return {
      score: finalScore,
      label: 'Sehr gut',
      summary: 'Das Transkript ist gut strukturiert und bereit für die KI-Analyse.',
      issues,
      level: 'good',
    }
  }

  if (finalScore >= 65) {
    return {
      score: finalScore,
      label: 'Okay',
      summary: 'Das Transkript ist nutzbar, kann aber noch besser strukturiert werden.',
      issues,
      level: 'warning',
    }
  }

  return {
    score: finalScore,
    label: 'Verbesserbar',
    summary: 'Das Transkript sollte vor der Analyse bereinigt oder klarer strukturiert werden.',
    issues,
    level: 'critical',
  }
}

export function transcriptQualityBadgeClass(level) {
  const classes = {
    good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    critical: 'border-red-200 bg-red-50 text-red-700',
  }

  return classes[level] || classes.warning
}
