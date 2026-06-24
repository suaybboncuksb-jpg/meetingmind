const DAY_IN_MS = 24 * 60 * 60 * 1000

export function isUnassignedTask(task) {
  const assignee = task?.assignee

  return assignee === null || assignee === undefined || String(assignee).trim() === ''
}

export function isOpenTask(task) {
  return task?.status !== 'DONE'
}

export function getUnassignedTasks(tasks = []) {
  return tasks.filter((task) => isOpenTask(task) && isUnassignedTask(task))
}

export function priorityLabel(priority) {
  const labels = {
    LOW: 'Niedrig',
    MEDIUM: 'Mittel',
    HIGH: 'Hoch',
  }

  return labels[priority] || 'Mittel'
}

export function statusLabel(status) {
  const labels = {
    OPEN: 'Offen',
    IN_PROGRESS: 'In Arbeit',
    DONE: 'Erledigt',
  }

  return labels[status] || 'Offen'
}

function todayStart() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return today
}

function parseLocalDate(value) {
  if (!value) return null

  const parts = String(value).split('-').map(Number)

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null
  }

  const [year, month, day] = parts
  return new Date(year, month - 1, day)
}

export function formatDeadline(value) {
  const date = parseLocalDate(value)

  if (!date) return '—'

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function getDeadlineState(task) {
  if (!task || task.status === 'DONE') {
    return 'done'
  }

  const deadline = parseLocalDate(task.deadline)

  if (!deadline) {
    return 'none'
  }

  const diffDays = Math.round((deadline.getTime() - todayStart().getTime()) / DAY_IN_MS)

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  if (diffDays <= 7) return 'this_week'

  return 'planned'
}

export function deadlineLabel(task) {
  const state = getDeadlineState(task)

  const labels = {
    overdue: 'Überfällig',
    today: 'Heute fällig',
    this_week: 'Diese Woche',
    planned: 'Geplant',
    none: 'Ohne Deadline',
    done: 'Erledigt',
  }

  return labels[state] || 'Geplant'
}

export function deadlineBadgeClass(task) {
  const state = getDeadlineState(task)

  const classes = {
    overdue: 'border-red-200 bg-red-50 text-red-700',
    today: 'border-amber-200 bg-amber-50 text-amber-700',
    this_week: 'border-blue-200 bg-blue-50 text-brand',
    planned: 'border-line bg-soft text-muted',
    none: 'border-line bg-soft text-muted',
    done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return classes[state] || classes.planned
}

export function getDeadlineRadarTasks(tasks = []) {
  const importantStates = new Set(['overdue', 'today', 'this_week'])

  return tasks
    .filter((task) => importantStates.has(getDeadlineState(task)))
    .sort((a, b) => {
      const dateA = parseLocalDate(a.deadline)?.getTime() || Number.MAX_SAFE_INTEGER
      const dateB = parseLocalDate(b.deadline)?.getTime() || Number.MAX_SAFE_INTEGER

      return dateA - dateB
    })
}

export function getDeadlineStats(tasks = []) {
  return tasks.reduce((stats, task) => {
    const state = getDeadlineState(task)

    if (state === 'overdue') stats.overdue += 1
    if (state === 'today') stats.today += 1
    if (state === 'this_week') stats.thisWeek += 1
    if (state === 'none' && task?.status !== 'DONE') stats.withoutDeadline += 1

    return stats
  }, {
    overdue: 0,
    today: 0,
    thisWeek: 0,
    withoutDeadline: 0,
  })
}
