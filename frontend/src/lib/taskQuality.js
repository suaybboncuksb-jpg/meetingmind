import { getDeadlineState, isUnassignedTask } from './tasks.js'

const GENERIC_TITLES = new Set([
  'test',
  'todo',
  'aufgabe',
  'machen',
  'klären',
  'prüfen',
  'besprechen',
  'vorbereiten',
])

function clampScore(value) {
  return Math.max(0, Math.min(100, value))
}

function titleLooksGeneric(title) {
  const normalized = String(title || '').trim().toLowerCase()

  if (!normalized) return false
  if (GENERIC_TITLES.has(normalized)) return true
  if (normalized.startsWith('test')) return true

  return false
}

function createIssue(title, description, severity = 'warning') {
  return { title, description, severity }
}

export function evaluateTaskQuality(task) {
  if (!task) {
    return {
      score: 0,
      level: 'critical',
      label: 'Verbesserung nötig',
      summary: 'Diese Aufgabe kann nicht bewertet werden.',
      issues: [
        createIssue(
          'Aufgabe fehlt',
          'Es liegen keine Aufgabendaten vor.',
          'critical',
        ),
      ],
    }
  }

  if (task.status === 'DONE') {
    return {
      score: 100,
      level: 'done',
      label: 'Erledigt',
      summary: 'Diese Aufgabe ist abgeschlossen.',
      issues: [],
    }
  }

  let score = 100
  const issues = []
  const title = String(task.title || '').trim()
  const words = title.split(/\s+/).filter(Boolean)

  if (!title) {
    score -= 35
    issues.push(createIssue(
      'Titel fehlt',
      'Die Aufgabe braucht einen klaren Titel, damit sofort erkennbar ist, was zu tun ist.',
      'critical',
    ))
  } else {
    if (title.length < 8 || words.length < 2) {
      score -= 20
      issues.push(createIssue(
        'Titel ist zu kurz',
        'Formuliere den Aufgabentitel konkreter, damit das erwartete Ergebnis klar erkennbar ist.',
      ))
    }

    if (titleLooksGeneric(title)) {
      score -= 25
      issues.push(createIssue(
        'Titel wirkt zu allgemein',
        'Vermeide Platzhalter wie „Test", „Aufgabe" oder „Machen". Besser ist ein konkretes Ergebnis.',
        'critical',
      ))
    }
  }

  if (isUnassignedTask(task)) {
    score -= 25
    issues.push(createIssue(
      'Zuständige Person fehlt',
      'Eine Aufgabe sollte immer einer Person zugeordnet sein, damit klar ist, wer sie bearbeitet.',
      'critical',
    ))
  }

  if (!task.deadline) {
    score -= 20
    issues.push(createIssue(
      'Frist fehlt',
      'Ohne Frist ist unklar, wann diese Aufgabe erledigt sein soll.',
    ))
  }

  if (!task.priority) {
    score -= 5
    issues.push(createIssue(
      'Priorität fehlt',
      'Eine Priorität hilft dabei, Aufgaben besser einzuordnen.',
    ))
  }

  if (!task.meetingTitle) {
    score -= 5
    issues.push(createIssue(
      'Besprechungsbezug fehlt',
      'Mit Besprechungsbezug ist später besser nachvollziehbar, woher die Aufgabe stammt.',
    ))
  }

  const deadlineState = getDeadlineState(task)

  if (deadlineState === 'overdue') {
    score -= 10
    issues.push(createIssue(
      'Aufgabe ist überfällig',
      'Die Frist wurde überschritten. Die Aufgabe sollte geprüft oder neu geplant werden.',
      'critical',
    ))
  }

  const finalScore = clampScore(score)

  if (finalScore >= 85) {
    return {
      score: finalScore,
      level: 'good',
      label: 'Sehr klar',
      summary: 'Diese Aufgabe ist klar, zugeordnet und gut planbar.',
      issues,
    }
  }

  if (finalScore >= 65) {
    return {
      score: finalScore,
      level: 'warning',
      label: 'Verbesserbar',
      summary: 'Diese Aufgabe ist nutzbar, für eine zuverlässige Bearbeitung fehlen aber noch einige Angaben.',
      issues,
    }
  }

  return {
    score: finalScore,
    level: 'critical',
    label: 'Verbesserung nötig',
    summary: 'Für eine zuverlässige Bearbeitung fehlen noch einige wichtige Angaben.',
    issues,
  }
}

export function taskQualityBadgeClass(task) {
  const quality = evaluateTaskQuality(task)

  const classes = {
    good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    critical: 'border-brand/20 bg-brand/10 text-brand',
    done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return classes[quality.level] || classes.warning
}

export function taskQualityLabel(task) {
  const quality = evaluateTaskQuality(task)

  return `${quality.score}% · ${quality.label}`
}