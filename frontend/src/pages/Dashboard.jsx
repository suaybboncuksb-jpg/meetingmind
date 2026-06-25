import { useMemo } from 'react'
import PageHeader from '../components/ui/PageHeader.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import DataCard from '../components/ui/DataCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import Button from '../components/ui/Button.jsx'
import {
  PlusIcon, CalendarIcon, SparklesIcon, CheckCircleIcon, ClockIcon,
  FileTextIcon, ListIcon, ArrowRightIcon,
} from '../components/icons.jsx'
import { deriveStats, sortByDateDesc, formatDate, meetingDateOf } from '../lib/meetings.js'
import {
  getUnassignedTasks,
  isUnassignedTask,
  priorityLabel,
  getDeadlineRadarTasks,
  getDeadlineStats,
  deadlineLabel,
  deadlineBadgeClass,
  formatDeadline,
  getDeadlineState,
} from '../lib/tasks.js'
import { createWorkBriefing } from '../lib/workBriefing.js'

function urgencyRank(task) {
  const state = getDeadlineState(task)

  const ranks = {
    overdue: 0,
    today: 1,
    this_week: 2,
    none: 3,
    planned: 4,
    done: 5,
  }

  return ranks[state] ?? 4
}

function byUrgencyThenDeadline(a, b) {
  const rankDiff = urgencyRank(a) - urgencyRank(b)
  if (rankDiff !== 0) return rankDiff

  const dateA = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
  const dateB = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER

  return dateA - dateB
}


function WorkBriefingCard({ briefing, onNavigate }) {
  const tone = {
    critical: {
      className: 'border-red-100 bg-red-50 text-red-800',
      badgeClass: 'bg-red-100 text-red-700',
    },
    warning: {
      className: 'border-amber-100 bg-amber-50 text-amber-800',
      badgeClass: 'bg-amber-100 text-amber-700',
    },
    info: {
      className: 'border-blue-100 bg-blue-50 text-brand',
      badgeClass: 'bg-blue-100 text-brand',
    },
    good: {
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
  }[briefing.status] || {
    className: 'border-line bg-canvas text-ink',
    badgeClass: 'bg-soft text-muted',
  }

  const sectionTitleClass = 'text-[13px] font-semibold text-ink'
  const emptyTextClass = 'text-[12.5px] leading-relaxed text-muted'

  return (
    <DataCard
      title="Tages- und Wochenbriefing"
      icon={SparklesIcon}
      noPadding
      action={<Button size="sm" variant="ghost" iconRight={ArrowRightIcon} onClick={() => onNavigate(briefing.nextActionPage)}>{briefing.nextActionLabel}</Button>}
    >
      <div className="border-b border-line px-6 py-5">
        <div className={`rounded-card border px-5 py-4 ${tone.className}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[18px] font-semibold">{briefing.headline}</p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badgeClass}`}>
                  {briefing.stats.criticalCount} kritisch
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed opacity-80">{briefing.summary}</p>
            </div>

            <Button size="sm" onClick={() => onNavigate(briefing.nextActionPage)}>
              {briefing.nextActionLabel}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <section className="px-6 py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className={sectionTitleClass}>Heute / Akut</h3>
            <span className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold text-muted">
              {briefing.todayItems.length}
            </span>
          </div>

          {briefing.todayItems.length === 0 ? (
            <p className={emptyTextClass}>Keine akuten Aufgaben für heute.</p>
          ) : (
            <ul className="space-y-3">
              {briefing.todayItems.map((item) => (
                <li key={item.id} className="rounded-button border border-line bg-canvas px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-[13px] font-semibold text-ink">{item.title}</p>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-muted">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{item.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="px-6 py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className={sectionTitleClass}>Diese Woche</h3>
            <span className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold text-muted">
              {briefing.stats.thisWeek}
            </span>
          </div>

          {briefing.weeklyItems.length === 0 ? (
            <p className={emptyTextClass}>Keine weiteren Aufgaben mit Deadline in dieser Woche.</p>
          ) : (
            <ul className="space-y-3">
              {briefing.weeklyItems.map((item) => (
                <li key={item.id} className="rounded-button border border-line bg-surface px-4 py-3">
                  <p className="text-[13px] font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">{item.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="px-6 py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className={sectionTitleClass}>Projektfokus</h3>
            <span className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold text-muted">
              {briefing.projectRisks.length}
            </span>
          </div>

          {briefing.projectRisks.length === 0 ? (
            <p className={emptyTextClass}>Keine kritischen Projektakten erkannt.</p>
          ) : (
            <ul className="space-y-3">
              {briefing.projectRisks.map((project) => (
                <li key={project.key} className="rounded-button border border-line bg-surface px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-[13px] font-semibold text-ink">{project.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                      project.criticalTasks > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {project.criticalTasks > 0 ? `${project.criticalTasks} kritisch` : 'stabil'}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">
                    {project.openTasks} offene Aufgabe(n), {project.highPriorityTasks} mit hoher Priorität
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DataCard>
  )
}

export default function Dashboard({ user, meetings = [], tasks = [], loading, onNewMeeting, onNavigate }) {
  const stats = useMemo(() => deriveStats(meetings, tasks), [meetings, tasks])
  const recent = useMemo(() => sortByDateDesc(meetings).slice(0, 5), [meetings])

  const unassignedTasks = useMemo(() => getUnassignedTasks(tasks), [tasks])
  const visibleUnassignedTasks = useMemo(() => unassignedTasks.slice(0, 4), [unassignedTasks])

  const deadlineRadarTasks = useMemo(() => getDeadlineRadarTasks(tasks), [tasks])
  const visibleDeadlineRadarTasks = useMemo(() => deadlineRadarTasks.slice(0, 4), [deadlineRadarTasks])
  const deadlineStats = useMemo(() => getDeadlineStats(tasks), [tasks])
  const workBriefing = useMemo(() => createWorkBriefing(meetings, tasks), [meetings, tasks])

  const actionTasks = useMemo(() => (
    [...tasks]
      .filter((task) => task.status !== 'DONE')
      .filter((task) => {
        const state = getDeadlineState(task)
        return state === 'overdue' || state === 'today' || isUnassignedTask(task)
      })
      .sort(byUrgencyThenDeadline)
      .slice(0, 6)
  ), [tasks])

  const upcomingTasks = useMemo(() => (
    [...tasks]
      .filter((task) => task.status !== 'DONE')
      .filter((task) => getDeadlineState(task) === 'this_week')
      .sort(byUrgencyThenDeadline)
      .slice(0, 4)
  ), [tasks])

  const firstName = user?.firstName || 'zurück'

  const actionHeadline = deadlineStats.overdue > 0
    ? `${deadlineStats.overdue} überfällige Aufgabe(n)`
    : deadlineStats.today > 0
      ? `${deadlineStats.today} Aufgabe(n) heute fällig`
      : unassignedTasks.length > 0
        ? `${unassignedTasks.length} Aufgabe(n) ohne Zuständige`
        : 'Alles im Griff'

  const actionDescription = deadlineStats.overdue > 0
    ? 'Diese Aufgaben sollten zuerst geprüft oder neu geplant werden.'
    : deadlineStats.today > 0
      ? 'Diese Aufgaben sind heute relevant und sollten priorisiert werden.'
      : unassignedTasks.length > 0
        ? 'Diese Aufgaben brauchen noch eine verantwortliche Person.'
        : 'Aktuell gibt es keine kritischen Aufgaben im Arbeitsfokus.'

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Guten Tag, ${firstName}`}
        subtitle="Dein Arbeitsfokus für Meetings, Aufgaben und Follow-ups."
        actions={<Button icon={PlusIcon} onClick={onNewMeeting}>Neues Meeting</Button>}
      />

      <WorkBriefingCard briefing={workBriefing} onNavigate={onNavigate} />

      {/* KPI-Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={ClockIcon} label="Überfällig" value={deadlineStats.overdue} accent="bg-red-50 text-red-700" />
        <StatCard icon={CalendarIcon} label="Heute fällig" value={deadlineStats.today} accent="bg-amber-50 text-amber-700" />
        <StatCard icon={CheckCircleIcon} label="Offene Aufgaben" value={stats.openTasks} accent="bg-soft text-muted" />
        <StatCard icon={ClockIcon} label="Ohne Zuständige" value={unassignedTasks.length} accent="bg-amber-50 text-amber-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Action Hub */}
          <DataCard
            title="Heute wichtig"
            icon={CheckCircleIcon}
            noPadding
            action={<Button size="sm" variant="ghost" iconRight={ArrowRightIcon} onClick={() => onNavigate('tasks')}>Aufgaben öffnen</Button>}
          >
            <div className="border-b border-line px-6 py-5">
              <div className="rounded-card border border-line bg-canvas p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[18px] font-semibold text-ink">{actionHeadline}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{actionDescription}</p>
                  </div>
                  <Button size="sm" onClick={() => onNavigate('tasks')}>
                    Jetzt prüfen
                  </Button>
                </div>
              </div>
            </div>

            {actionTasks.length === 0 ? (
              <div className="px-6 py-8">
                <div className="rounded-button border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-emerald-700">Keine akuten Aufgaben</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-emerald-700/75">
                    Es gibt aktuell keine überfälligen, heute fälligen oder unzugeordneten Aufgaben.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {actionTasks.map((task) => (
                  <li key={task.id} className="px-6 py-4 transition hover:bg-canvas">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[14px] font-semibold text-ink">
                            {task.title || 'Ohne Titel'}
                          </p>
                          {task.projectName ? (
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                              {task.projectName}
                            </span>
                          ) : null}
                        </div>

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

          {/* Letzte Meetings */}
          <DataCard
            title="Letzte Meetings"
            icon={ListIcon}
            noPadding
            action={<Button size="sm" variant="ghost" iconRight={ArrowRightIcon} onClick={() => onNavigate('meetings')}>Alle ansehen</Button>}
          >
            {loading ? (
              <div className="px-6 py-12 text-center text-[14px] text-muted">Wird geladen…</div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="Noch keine Meetings"
                description="Erstelle dein erstes Meeting, um KI-Zusammenfassungen und Aufgaben zu erhalten."
                action={<Button size="sm" variant="secondary" icon={PlusIcon} onClick={onNewMeeting}>Meeting erstellen</Button>}
              />
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((meeting) => (
                  <li key={meeting.id} className="flex items-center gap-4 px-6 py-4 transition hover:bg-canvas">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-navy">
                      <FileTextIcon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[14px] font-medium text-ink">{meeting.title || 'Ohne Titel'}</p>
                        {meeting.projectName ? (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                            {meeting.projectName}
                          </span>
                        ) : null}
                      </div>
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
        </div>

        <aside className="flex flex-col gap-4">
          <DataCard
            title="Deadline-Radar"
            icon={ClockIcon}
            noPadding
            action={<Button size="sm" variant="ghost" iconRight={ArrowRightIcon} onClick={() => onNavigate('tasks')}>Prüfen</Button>}
          >
            {visibleDeadlineRadarTasks.length === 0 ? (
              <div className="px-6 py-8">
                <div className="rounded-button border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-emerald-700">Keine kritischen Deadlines</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-emerald-700/75">
                    Aktuell sind keine offenen Aufgaben überfällig oder kurzfristig fällig.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-3 gap-2 px-6 py-4">
                  <div className="rounded-button bg-red-50 px-3 py-2 text-center">
                    <p className="text-[16px] font-semibold text-red-700">{deadlineStats.overdue}</p>
                    <p className="text-[11px] text-red-700/70">Überfällig</p>
                  </div>
                  <div className="rounded-button bg-amber-50 px-3 py-2 text-center">
                    <p className="text-[16px] font-semibold text-amber-700">{deadlineStats.today}</p>
                    <p className="text-[11px] text-amber-700/70">Heute</p>
                  </div>
                  <div className="rounded-button bg-blue-50 px-3 py-2 text-center">
                    <p className="text-[16px] font-semibold text-brand">{deadlineStats.thisWeek}</p>
                    <p className="text-[11px] text-brand/70">Woche</p>
                  </div>
                </div>

                <ul className="divide-y divide-line">
                  {visibleDeadlineRadarTasks.map((task) => (
                    <li key={task.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold text-ink">
                            {task.title || 'Ohne Titel'}
                          </p>
                          <p className="mt-1 text-[12.5px] text-muted">
                            Deadline: {formatDeadline(task.deadline)}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${deadlineBadgeClass(task)}`}>
                          {deadlineLabel(task)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </DataCard>

          <DataCard
            title="Ohne Zuständige"
            icon={ClockIcon}
            noPadding
            action={<Button size="sm" variant="ghost" iconRight={ArrowRightIcon} onClick={() => onNavigate('tasks')}>Prüfen</Button>}
          >
            {visibleUnassignedTasks.length === 0 ? (
              <div className="px-6 py-8">
                <div className="rounded-button border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-emerald-700">Alles zugeordnet</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-emerald-700/75">
                    Aktuell gibt es keine offenen Aufgaben ohne zuständige Person.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {visibleUnassignedTasks.map((task) => (
                  <li key={task.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-ink">
                          {task.title || 'Ohne Titel'}
                        </p>
                        <p className="mt-1 text-[12.5px] text-muted">
                          Priorität: {priorityLabel(task.priority)}
                          {task.deadline ? ` · Deadline: ${formatDeadline(task.deadline)}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        Offen
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DataCard>

          <DataCard title="Diese Woche" icon={CalendarIcon} noPadding>
            {upcomingTasks.length === 0 ? (
              <div className="px-6 py-8">
                <div className="rounded-button border border-line bg-canvas px-4 py-3">
                  <p className="text-[13px] font-semibold text-ink">Keine weiteren Wochenaufgaben</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                    Es gibt aktuell keine weiteren offenen Aufgaben mit Deadline in dieser Woche.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {upcomingTasks.map((task) => (
                  <li key={task.id} className="px-6 py-4">
                    <p className="truncate text-[14px] font-semibold text-ink">{task.title || 'Ohne Titel'}</p>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {formatDeadline(task.deadline)}
                      {task.projectName ? ` · ${task.projectName}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </DataCard>

          <div
            className="relative overflow-hidden rounded-card border border-white/12 p-6 text-white shadow-card"
            style={{ background: 'linear-gradient(160deg, #1b365d 0%, #0d2137 100%)' }}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/25 blur-2xl" />
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-md">
              <SparklesIcon size={20} className="text-[#7FB2E0]" />
            </span>
            <h3 className="relative mt-4 text-[15px] font-semibold">Schnellaktionen</h3>
            <p className="relative mt-1.5 text-[13px] leading-relaxed text-white/70">
              Starte ein Meeting mit Vorlage oder prüfe deine Aufgaben.
            </p>
            <div className="relative mt-5 flex flex-col gap-2">
              <button
                onClick={onNewMeeting}
                className="inline-flex items-center justify-center gap-2 rounded-button bg-white px-4 py-2.5 text-[13px] font-semibold text-navy transition hover:bg-white/90"
              >
                <PlusIcon size={16} /> Neues Meeting erstellen
              </button>
              <button
                onClick={() => onNavigate('tasks')}
                className="inline-flex items-center justify-center gap-2 rounded-button border border-white/15 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                <CheckCircleIcon size={16} /> Aufgaben prüfen
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
