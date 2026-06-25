import {
  formatDeadline,
  getDeadlineState,
  isOpenTask,
  isUnassignedTask,
  priorityLabel,
} from './tasks.js'

function sortByUrgency(a, b) {
  const ranks = {
    overdue: 0,
    today: 1,
    none: 2,
    this_week: 3,
    planned: 4,
    done: 5,
  }

  const rankA = ranks[getDeadlineState(a)] ?? 4
  const rankB = ranks[getDeadlineState(b)] ?? 4

  if (rankA !== rankB) return rankA - rankB

  const dateA = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
  const dateB = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER

  return dateA - dateB
}

function uniqueTasks(tasks = []) {
  const seen = new Set()

  return tasks.filter((task) => {
    if (!task?.id) return true
    if (seen.has(task.id)) return false

    seen.add(task.id)
    return true
  })
}

function taskItem(task, type) {
  const project = task.projectName ? ` · ${task.projectName}` : ''
  const meeting = task.meetingTitle || 'Ohne Meeting'
  const deadline = task.deadline ? ` · ${formatDeadline(task.deadline)}` : ' · ohne Deadline'

  const labels = {
    overdue: 'Überfällig',
    today: 'Heute fällig',
    unassigned: 'Ohne Zuständige',
    no_deadline: 'Ohne Deadline',
    this_week: 'Diese Woche',
  }

  const levels = {
    overdue: 'critical',
    today: 'warning',
    unassigned: 'warning',
    no_deadline: 'neutral',
    this_week: 'info',
  }

  return {
    id: `${type}-${task.id}`,
    title: task.title || 'Ohne Titel',
    description: `${meeting}${project}${deadline}`,
    badge: labels[type] || 'Aufgabe',
    level: levels[type] || 'neutral',
  }
}

function buildProjectRisks(openTasks = []) {
  const projects = new Map()

  openTasks.forEach((task) => {
    const name = String(task.projectName || '').trim()
    if (!name) return

    const key = name.toLowerCase()

    if (!projects.has(key)) {
      projects.set(key, {
        key,
        name,
        openTasks: 0,
        criticalTasks: 0,
        highPriorityTasks: 0,
      })
    }

    const project = projects.get(key)
    const state = getDeadlineState(task)

    project.openTasks += 1

    if (state === 'overdue' || state === 'today' || isUnassignedTask(task)) {
      project.criticalTasks += 1
    }

    if (task.priority === 'HIGH') {
      project.highPriorityTasks += 1
    }
  })

  return Array.from(projects.values())
    .sort((a, b) => {
      if (b.criticalTasks !== a.criticalTasks) return b.criticalTasks - a.criticalTasks
      if (b.highPriorityTasks !== a.highPriorityTasks) return b.highPriorityTasks - a.highPriorityTasks

      return b.openTasks - a.openTasks
    })
    .slice(0, 3)
}

export function createWorkBriefing(meetings = [], tasks = []) {
  const openTasks = tasks.filter(isOpenTask)

  const overdueTasks = openTasks.filter((task) => getDeadlineState(task) === 'overdue')
  const todayTasks = openTasks.filter((task) => getDeadlineState(task) === 'today')
  const thisWeekTasks = openTasks.filter((task) => getDeadlineState(task) === 'this_week')
  const unassignedTasks = openTasks.filter(isUnassignedTask)
  const withoutDeadlineTasks = openTasks.filter((task) => getDeadlineState(task) === 'none')

  const meetingsWithoutAnalysis = meetings.filter((meeting) => {
    const status = String(meeting.status || '').toUpperCase()
    return status !== 'ANALYZED' && !meeting.aiSummary
  })

  const todayItems = uniqueTasks([
    ...overdueTasks.map((task) => ({ task, type: 'overdue' })),
    ...todayTasks.map((task) => ({ task, type: 'today' })),
    ...unassignedTasks.map((task) => ({ task, type: 'unassigned' })),
    ...withoutDeadlineTasks.map((task) => ({ task, type: 'no_deadline' })),
  ].map((entry) => ({ ...entry.task, briefingType: entry.type })))
    .sort(sortByUrgency)
    .slice(0, 5)
    .map((task) => taskItem(task, task.briefingType))

  const weeklyItems = thisWeekTasks
    .sort(sortByUrgency)
    .slice(0, 4)
    .map((task) => ({
      ...taskItem(task, 'this_week'),
      description: `${task.meetingTitle || 'Ohne Meeting'}${task.projectName ? ` · ${task.projectName}` : ''} · Priorität: ${priorityLabel(task.priority)}`,
    }))

  const projectRisks = buildProjectRisks(openTasks)

  const criticalCount = overdueTasks.length + todayTasks.length + unassignedTasks.length

  let status = 'good'
  let headline = 'Dein Arbeitstag ist stabil'
  let summary = 'Aktuell gibt es keine überfälligen, heute fälligen oder unzugeordneten Aufgaben.'
  let nextActionLabel = 'Projekte prüfen'
  let nextActionPage = 'projects'

  if (overdueTasks.length > 0) {
    status = 'critical'
    headline = `${overdueTasks.length} Aufgabe(n) sind überfällig`
    summary = 'Starte mit den überfälligen Aufgaben und entscheide, ob sie erledigt oder neu geplant werden müssen.'
    nextActionLabel = 'Überfällige Aufgaben prüfen'
    nextActionPage = 'tasks'
  } else if (todayTasks.length > 0) {
    status = 'warning'
    headline = `${todayTasks.length} Aufgabe(n) sind heute fällig`
    summary = 'Diese Aufgaben sollten heute erledigt oder aktiv neu priorisiert werden.'
    nextActionLabel = 'Heutige Aufgaben prüfen'
    nextActionPage = 'tasks'
  } else if (unassignedTasks.length > 0) {
    status = 'warning'
    headline = `${unassignedTasks.length} Aufgabe(n) brauchen Verantwortliche`
    summary = 'Ordne diese Aufgaben zu, damit klar ist, wer die Umsetzung übernimmt.'
    nextActionLabel = 'Aufgaben zuordnen'
    nextActionPage = 'tasks'
  } else if (thisWeekTasks.length > 0) {
    status = 'info'
    headline = `${thisWeekTasks.length} Aufgabe(n) stehen diese Woche an`
    summary = 'Die Woche sieht planbar aus. Prüfe die nächsten Deadlines rechtzeitig.'
    nextActionLabel = 'Wochenaufgaben prüfen'
    nextActionPage = 'tasks'
  } else if (meetingsWithoutAnalysis.length > 0) {
    status = 'info'
    headline = `${meetingsWithoutAnalysis.length} Meeting(s) warten auf Analyse`
    summary = 'Analysiere offene Meetings, damit Aufgaben, Follow-ups und Entscheidungen sichtbar werden.'
    nextActionLabel = 'Meetings öffnen'
    nextActionPage = 'meetings'
  }

  return {
    status,
    headline,
    summary,
    nextActionLabel,
    nextActionPage,
    stats: {
      criticalCount,
      overdue: overdueTasks.length,
      today: todayTasks.length,
      thisWeek: thisWeekTasks.length,
      unassigned: unassignedTasks.length,
      withoutDeadline: withoutDeadlineTasks.length,
      meetingsWithoutAnalysis: meetingsWithoutAnalysis.length,
    },
    todayItems,
    weeklyItems,
    projectRisks,
  }
}
