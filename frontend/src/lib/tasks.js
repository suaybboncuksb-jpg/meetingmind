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
