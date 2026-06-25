import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader.jsx'
import DataCard from '../components/ui/DataCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import Button from '../components/ui/Button.jsx'
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  ListIcon,
  UsersIcon,
} from '../components/icons.jsx'
import { formatDate, meetingDateOf, sortByDateDesc } from '../lib/meetings.js'
import {
  deadlineBadgeClass,
  deadlineLabel,
  formatDeadline,
  getDeadlineState,
  isUnassignedTask,
  priorityLabel,
} from '../lib/tasks.js'

function normalizeProjectName(value) {
  return String(value || '').trim()
}

function buildProjectFiles(meetings = [], tasks = []) {
  const projects = new Map()

  const ensureProject = (name) => {
    const cleanName = normalizeProjectName(name)
    if (!cleanName) return null

    const key = cleanName.toLowerCase()

    if (!projects.has(key)) {
      projects.set(key, {
        key,
        name: cleanName,
        meetings: [],
        tasks: [],
        openTasks: 0,
        doneTasks: 0,
        overdueTasks: 0,
        todayTasks: 0,
        thisWeekTasks: 0,
        unassignedTasks: 0,
      })
    }

    return projects.get(key)
  }

  meetings.forEach((meeting) => {
    const project = ensureProject(meeting.projectName)
    if (project) {
      project.meetings.push(meeting)
    }
  })

  tasks.forEach((task) => {
    const project = ensureProject(task.projectName)
    if (!project) return

    project.tasks.push(task)

    if (task.status === 'DONE') {
      project.doneTasks += 1
      return
    }

    project.openTasks += 1

    const deadlineState = getDeadlineState(task)

    if (deadlineState === 'overdue') project.overdueTasks += 1
    if (deadlineState === 'today') project.todayTasks += 1
    if (deadlineState === 'this_week') project.thisWeekTasks += 1
    if (isUnassignedTask(task)) project.unassignedTasks += 1
  })

  return Array.from(projects.values())
    .map((project) => ({
      ...project,
      meetings: sortByDateDesc(project.meetings),
      tasks: [...project.tasks].sort((a, b) => {
        const rank = { overdue: 0, today: 1, this_week: 2, none: 3, planned: 4, done: 5 }
        const rankA = rank[getDeadlineState(a)] ?? 4
        const rankB = rank[getDeadlineState(b)] ?? 4

        if (rankA !== rankB) return rankA - rankB

        const dateA = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
        const dateB = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER

        return dateA - dateB
      }),
    }))
    .sort((a, b) => {
      const criticalDiff = (b.overdueTasks + b.todayTasks + b.unassignedTasks) - (a.overdueTasks + a.todayTasks + a.unassignedTasks)
      if (criticalDiff !== 0) return criticalDiff

      return a.name.localeCompare(b.name)
    })
}

export default function Projects({ meetings = [], tasks = [], onNavigate }) {
  const projectFiles = useMemo(() => buildProjectFiles(meetings, tasks), [meetings, tasks])
  const [selectedProjectKey, setSelectedProjectKey] = useState(null)

  const selectedProject = useMemo(() => {
    if (!selectedProjectKey) return projectFiles[0] || null

    return projectFiles.find((project) => project.key === selectedProjectKey) || projectFiles[0] || null
  }, [projectFiles, selectedProjectKey])

  const totalOpenTasks = projectFiles.reduce((sum, project) => sum + project.openTasks, 0)
  const totalCriticalTasks = projectFiles.reduce(
    (sum, project) => sum + project.overdueTasks + project.todayTasks + project.unassignedTasks,
    0,
  )

  return (
    <div className="space-y-7">
      <PageHeader
        title="Projekte / Kunden"
        subtitle="Digitale Akten für Kunden, Projekte, Meetings, Aufgaben und offene Punkte."
      />

      {projectFiles.length === 0 ? (
        <DataCard title="Noch keine Projektakten" icon={UsersIcon}>
          <EmptyState
            icon={UsersIcon}
            title="Noch keine Projekte oder Kunden"
            description="Sobald du bei Meetings ein Projekt oder einen Kunden einträgst, entsteht hier automatisch eine Projektakte."
            action={<Button size="sm" onClick={() => onNavigate('meetings')}>Meetings öffnen</Button>}
          />
        </DataCard>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <DataCard title="Projektakten" icon={UsersIcon}>
              <p className="text-3xl font-semibold text-ink">{projectFiles.length}</p>
              <p className="mt-1 text-[13px] text-muted">aktive Kunden / Projekte</p>
            </DataCard>

            <DataCard title="Meetings" icon={CalendarIcon}>
              <p className="text-3xl font-semibold text-ink">
                {projectFiles.reduce((sum, project) => sum + project.meetings.length, 0)}
              </p>
              <p className="mt-1 text-[13px] text-muted">mit Projektbezug</p>
            </DataCard>

            <DataCard title="Offene Aufgaben" icon={CheckCircleIcon}>
              <p className="text-3xl font-semibold text-ink">{totalOpenTasks}</p>
              <p className="mt-1 text-[13px] text-muted">über alle Projektakten</p>
            </DataCard>

            <DataCard title="Kritische Punkte" icon={ClockIcon}>
              <p className="text-3xl font-semibold text-ink">{totalCriticalTasks}</p>
              <p className="mt-1 text-[13px] text-muted">überfällig, heute oder unzugeordnet</p>
            </DataCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <DataCard title="Projektübersicht" icon={ListIcon} noPadding>
              <ul className="divide-y divide-line">
                {projectFiles.map((project) => {
                  const active = selectedProject?.key === project.key
                  const criticalCount = project.overdueTasks + project.todayTasks + project.unassignedTasks

                  return (
                    <li key={project.key}>
                      <button
                        type="button"
                        onClick={() => setSelectedProjectKey(project.key)}
                        className={`w-full px-6 py-4 text-left transition ${
                          active ? 'bg-navy/[0.04]' : 'hover:bg-canvas'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold text-ink">{project.name}</p>
                            <p className="mt-1 text-[12.5px] text-muted">
                              {project.meetings.length} Meeting(s) · {project.openTasks} offene Aufgabe(n)
                            </p>
                          </div>

                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            criticalCount > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {criticalCount > 0 ? `${criticalCount} kritisch` : 'stabil'}
                          </span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </DataCard>

            <div className="space-y-6 lg:col-span-2">
              {selectedProject ? (
                <>
                  <DataCard
                    title={`Projektakte: ${selectedProject.name}`}
                    icon={UsersIcon}
                    action={<Button size="sm" variant="ghost" iconRight={ArrowRightIcon} onClick={() => onNavigate('tasks')}>Aufgaben öffnen</Button>}
                  >
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                      <div className="rounded-button bg-canvas px-4 py-3">
                        <p className="text-[18px] font-semibold text-ink">{selectedProject.meetings.length}</p>
                        <p className="text-[12px] text-muted">Meetings</p>
                      </div>
                      <div className="rounded-button bg-canvas px-4 py-3">
                        <p className="text-[18px] font-semibold text-ink">{selectedProject.openTasks}</p>
                        <p className="text-[12px] text-muted">Offen</p>
                      </div>
                      <div className="rounded-button bg-red-50 px-4 py-3">
                        <p className="text-[18px] font-semibold text-red-700">{selectedProject.overdueTasks}</p>
                        <p className="text-[12px] text-red-700/70">Überfällig</p>
                      </div>
                      <div className="rounded-button bg-amber-50 px-4 py-3">
                        <p className="text-[18px] font-semibold text-amber-700">{selectedProject.todayTasks}</p>
                        <p className="text-[12px] text-amber-700/70">Heute</p>
                      </div>
                      <div className="rounded-button bg-blue-50 px-4 py-3">
                        <p className="text-[18px] font-semibold text-brand">{selectedProject.thisWeekTasks}</p>
                        <p className="text-[12px] text-brand/70">Woche</p>
                      </div>
                    </div>
                  </DataCard>

                  <DataCard title="Meetings dieser Akte" icon={FileTextIcon} noPadding>
                    {selectedProject.meetings.length === 0 ? (
                      <div className="px-6 py-8 text-[13px] text-muted">
                        Für diese Akte gibt es noch keine Meetings.
                      </div>
                    ) : (
                      <ul className="divide-y divide-line">
                        {selectedProject.meetings.slice(0, 6).map((meeting) => (
                          <li key={meeting.id} className="flex items-center gap-4 px-6 py-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-navy">
                              <FileTextIcon size={18} />
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-semibold text-ink">
                                {meeting.title || 'Ohne Titel'}
                              </p>
                              <p className="mt-0.5 truncate text-[12.5px] text-muted">
                                {formatDate(meetingDateOf(meeting))}
                                {meeting.description ? ` · ${meeting.description}` : ''}
                              </p>
                            </div>

                            <StatusBadge status={meeting.status} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </DataCard>

                  <DataCard title="Aufgaben dieser Akte" icon={CheckCircleIcon} noPadding>
                    {selectedProject.tasks.length === 0 ? (
                      <div className="px-6 py-8 text-[13px] text-muted">
                        Für diese Akte gibt es noch keine Aufgaben.
                      </div>
                    ) : (
                      <ul className="divide-y divide-line">
                        {selectedProject.tasks.slice(0, 8).map((task) => (
                          <li key={task.id} className="px-6 py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="truncate text-[14px] font-semibold text-ink">
                                  {task.title || 'Ohne Titel'}
                                </p>
                                <p className="mt-1 text-[12.5px] text-muted">
                                  {task.meetingTitle || 'Ohne Meeting'}
                                  {task.assignee ? ` · Zuständig: ${task.assignee}` : ' · Kein Verantwortlicher'}
                                </p>
                                <p className="mt-1 text-[12.5px] text-muted">
                                  Priorität: {priorityLabel(task.priority)}
                                  {task.deadline ? ` · Deadline: ${formatDeadline(task.deadline)}` : ' · Ohne Deadline'}
                                </p>
                              </div>

                              <div className="flex shrink-0 flex-wrap gap-2">
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${deadlineBadgeClass(task)}`}>
                                  {deadlineLabel(task)}
                                </span>

                                {isUnassignedTask(task) ? (
                                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                    Ohne Zuständige
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </DataCard>
                </>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
