import { useMemo } from 'react'
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
      card: 'border-red-100 bg-red-50/70 text-red-800',
      badge: 'bg-red-100 text-red-700',
      label: 'Kritisch',
    },
    warning: {
      card: 'border-amber-100 bg-amber-50/70 text-amber-800',
      badge: 'bg-amber-100 text-amber-700',
      label: 'Prüfen',
    },
    info: {
      card: 'border-blue-100 bg-blue-50/70 text-brand',
      badge: 'bg-blue-100 text-brand',
      label: 'Hinweis',
    },
    good: {
      card: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700',
      label: 'Stabil',
    },
  }[briefing.status] || {
    card: 'border-line bg-canvas text-ink',
    badge: 'bg-soft text-muted',
    label: 'Status',
  }

  const previewItems = [
    {
      title: 'Akut',
      value: briefing.todayItems.length,
      description: briefing.todayItems.length === 0
        ? 'Keine akuten Aufgaben für heute.'
        : `${briefing.todayItems.length} Aufgabe(n) brauchen kurzfristig Aufmerksamkeit.`,
      items: briefing.todayItems.slice(0, 2),
    },
    {
      title: 'Diese Woche',
      value: briefing.stats.thisWeek,
      description: briefing.weeklyItems.length === 0
        ? 'Keine weiteren Wochenaufgaben.'
        : `${briefing.weeklyItems.length} Aufgabe(n) sind diese Woche relevant.`,
      items: briefing.weeklyItems.slice(0, 2),
    },
    {
      title: 'Mandatsfokus',
      value: briefing.projectRisks.length,
      description: briefing.projectRisks.length === 0
        ? 'Keine kritischen Mandatsakten erkannt.'
        : `${briefing.projectRisks.length} Mandatsakte(n) sollten geprüft werden.`,
      items: briefing.projectRisks.slice(0, 2).map((project) => ({
        id: project.key,
        title: project.name,
        badge: project.criticalTasks > 0 ? `${project.criticalTasks} kritisch` : 'stabil',
        description: `${project.openTasks} offene Aufgabe(n), ${project.highPriorityTasks} mit hoher Priorität`,
      })),
    },
  ]

  return (
    <DataCard
      title="Tagesüberblick"
      icon={SparklesIcon}
      noPadding
      action={
        <Button
          size="sm"
          variant="ghost"
          iconRight={ArrowRightIcon}
          onClick={() => onNavigate(briefing.nextActionPage)}
        >
          {briefing.nextActionLabel}
        </Button>
      }
    >
      <div className="px-6 py-5">
        <div className={`rounded-[24px] border px-5 py-4 ${tone.card}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}>
                  {tone.label}
                </span>
                <p className="text-[16px] font-semibold">{briefing.headline}</p>
              </div>
              <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed opacity-80">
                {briefing.summary}
              </p>
            </div>

            <Button size="sm" onClick={() => onNavigate(briefing.nextActionPage)}>
              Fokus öffnen
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {previewItems.map((section) => (
          <section key={section.title} className="px-6 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[13px] font-semibold text-ink">{section.title}</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                  {section.description}
                </p>
              </div>

              <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-soft px-2 text-[12px] font-semibold text-muted">
                {section.value}
              </span>
            </div>

            {section.items.length === 0 ? (
              <div className="rounded-2xl border border-line bg-canvas/70 px-4 py-3">
                <p className="text-[12.5px] leading-relaxed text-muted">
                  Kein Handlungsbedarf in diesem Bereich.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {section.items.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-line bg-canvas/70 px-4 py-3 transition hover:bg-surface">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-[13px] font-semibold text-ink">
                        {item.title}
                      </p>
                      {item.badge ? (
                        <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10.5px] font-semibold text-muted">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="mt-1 text-[12px] leading-relaxed text-muted">
                        {item.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </DataCard>
  )
}



function DashboardHero({
  firstName,
  meetingsCount,
  openTasks,
  deadlineStats,
  unassignedCount,
  onNewMeeting,
  onNavigate,
}) {
  const hasUrgency = deadlineStats.overdue > 0 || deadlineStats.today > 0 || unassignedCount > 0

  const focusHeadline = deadlineStats.overdue > 0
    ? `${deadlineStats.overdue} Aufgabe(n) brauchen Aufmerksamkeit`
    : deadlineStats.today > 0
      ? `${deadlineStats.today} Aufgabe(n) sind heute fällig`
      : unassignedCount > 0
        ? `${unassignedCount} Aufgabe(n) brauchen eine Zuständige`
        : 'Dein Workspace ist aktuell ruhig'

  const focusDescription = deadlineStats.overdue > 0
    ? 'Prüfe zuerst die überfälligen Aufgaben und entscheide, ob sie erledigt oder neu geplant werden müssen.'
    : deadlineStats.today > 0
      ? 'Heute gibt es Aufgaben, die aktiv priorisiert oder abgeschlossen werden sollten.'
      : unassignedCount > 0
        ? 'Einige Aufgaben sind noch keiner Person zugeordnet und könnten sonst liegen bleiben.'
        : 'Es gibt aktuell keine kritischen Aufgaben im Arbeitsfokus.'

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-line/80 bg-surface/86 p-6 shadow-card backdrop-blur-xl sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative grid gap-7 lg:grid-cols-[1.5fr_0.85fr] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-canvas/80 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            <SparklesIcon size={14} className="text-brand" />
            MeetingMind Workspace
          </div>

          <h1 className="max-w-3xl text-[34px] font-semibold tracking-[-0.045em] text-ink sm:text-[40px] lg:text-[44px]">
            Guten Tag, {firstName}
          </h1>

          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            Behalte Entscheidungen, Aufgaben und offene Fragen aus deinen Meetings im Blick – von der Analyse bis zur Umsetzung.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button icon={PlusIcon} onClick={onNewMeeting}>
              Neue Besprechung
            </Button>
            <Button variant="secondary" iconRight={ArrowRightIcon} onClick={() => onNavigate('tasks')}>
              Aufgaben prüfen
            </Button>
          </div>
        </div>

        <div className="relative rounded-[26px] border border-line bg-canvas/70 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
                Heute im Fokus
              </p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-ink">
                {focusHeadline}
              </h2>
            </div>

            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              hasUrgency
                ? 'bg-amber-50 text-amber-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}>
              {hasUrgency ? 'Prüfen' : 'Stabil'}
            </span>
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            {focusDescription}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-line bg-surface px-3 py-3">
              <p className="text-[20px] font-semibold text-ink">{meetingsCount}</p>
              <p className="mt-0.5 text-[11.5px] text-muted">Besprechungen</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface px-3 py-3">
              <p className="text-[20px] font-semibold text-ink">{openTasks}</p>
              <p className="mt-0.5 text-[11.5px] text-muted">Offen</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface px-3 py-3">
              <p className="text-[20px] font-semibold text-ink">{deadlineStats.overdue}</p>
              <p className="mt-0.5 text-[11.5px] text-muted">Überfällig</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


function MetricCard({ icon: Icon, label, value, description, tone = 'neutral' }) {
  const toneClass = {
    critical: {
      icon: 'bg-red-50 text-red-700',
      value: 'text-red-700',
      ring: 'hover:border-red-100',
    },
    warning: {
      icon: 'bg-amber-50 text-amber-700',
      value: 'text-amber-700',
      ring: 'hover:border-amber-100',
    },
    info: {
      icon: 'bg-blue-50 text-brand',
      value: 'text-ink',
      ring: 'hover:border-blue-100',
    },
    neutral: {
      icon: 'bg-soft text-muted',
      value: 'text-ink',
      ring: 'hover:border-line',
    },
  }[tone] || {
    icon: 'bg-soft text-muted',
    value: 'text-ink',
    ring: 'hover:border-line',
  }

  return (
    <div className={`group rounded-[26px] border border-line/80 bg-surface/86 p-5 shadow-soft backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-card ${toneClass.ring}`}>
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClass.icon}`}>
          <Icon size={18} />
        </span>

        <span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-muted">
          Live
        </span>
      </div>

      <p className={`mt-5 text-[32px] font-semibold tracking-[-0.045em] ${toneClass.value}`}>
        {value}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-ink">{label}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{description}</p>
    </div>
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
      <DashboardHero
        firstName={firstName}
        meetingsCount={meetings.length}
        openTasks={stats.openTasks}
        deadlineStats={deadlineStats}
        unassignedCount={unassignedTasks.length}
        onNewMeeting={onNewMeeting}
        onNavigate={onNavigate}
      />

      <WorkBriefingCard briefing={workBriefing} onNavigate={onNavigate} />

      {/* KPI-Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ClockIcon}
          label="Überfällig"
          value={deadlineStats.overdue}
          description="Sollten zuerst geprüft oder neu geplant werden."
          tone={deadlineStats.overdue > 0 ? 'critical' : 'neutral'}
        />
        <MetricCard
          icon={CalendarIcon}
          label="Heute fällig"
          value={deadlineStats.today}
          description="Aufgaben, die heute aktiv relevant sind."
          tone={deadlineStats.today > 0 ? 'warning' : 'neutral'}
        />
        <MetricCard
          icon={CheckCircleIcon}
          label="Offene Aufgaben"
          value={stats.openTasks}
          description="Noch nicht abgeschlossene Aufgaben."
          tone="info"
        />
        <MetricCard
          icon={ClockIcon}
          label="Ohne Zuständige"
          value={unassignedTasks.length}
          description="Brauchen eine klare Verantwortlichkeit."
          tone={unassignedTasks.length > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Heute zu klären */}
          <DataCard
            title="Heute zu klären"
            icon={CheckCircleIcon}
            noPadding
            action={<Button size="sm" variant="ghost" iconRight={ArrowRightIcon} onClick={() => onNavigate('tasks')}>Aufgaben</Button>}
          >
            <div className="border-b border-line px-6 py-5">
              <div className="rounded-[24px] border border-line bg-canvas/70 p-5 shadow-soft">
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
              <ul className="space-y-3 px-6 py-5">
                {actionTasks.map((task) => (
                  <li key={task.id} className="rounded-[20px] border border-line bg-canvas/70 px-4 py-3 transition hover:bg-surface hover:shadow-soft">
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
                          {task.meetingTitle || 'Ohne Besprechung'}
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

          {/* Letzte Besprechungen */}
          <DataCard
            title="Letzte Besprechungen"
            icon={ListIcon}
            noPadding
            action={<Button size="sm" variant="ghost" iconRight={ArrowRightIcon} onClick={() => onNavigate('meetings')}>Besprechungen</Button>}
          >
            {loading ? (
              <div className="px-6 py-12 text-center text-[14px] text-muted">Wird geladen…</div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="Noch keine Besprechungen erfasst"
                description="Erstelle eine Besprechung oder analysiere ein Protokoll, damit MeetingMind Aufgaben, Zuständigkeiten, Fristen und offene Rückfragen erkennt."
                action={<Button size="sm" variant="secondary" icon={PlusIcon} onClick={onNewMeeting}>Besprechung erstellen</Button>}
              />
            ) : (
              <ul className="space-y-3 px-6 py-5">
                {recent.map((meeting) => (
                  <li key={meeting.id} className="flex items-center gap-4 rounded-[20px] border border-line bg-canvas/70 px-4 py-3 transition hover:bg-surface hover:shadow-soft">
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
          {/* Fristenradar (inkl. "Diese Woche relevant") */}
          <DataCard
            title="Fristenradar"
            icon={ClockIcon}
            noPadding
            action={<Button size="sm" variant="ghost" iconRight={ArrowRightIcon} onClick={() => onNavigate('tasks')}>Prüfen</Button>}
          >
            {visibleDeadlineRadarTasks.length === 0 && upcomingTasks.length === 0 ? (
              <div className="px-6 py-8">
                <div className="rounded-button border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-emerald-700">Keine kritischen Fristen</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-emerald-700/75">
                    Aktuell sind keine offenen Aufgaben überfällig, heute fällig oder diese Woche relevant.
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

                {visibleDeadlineRadarTasks.length > 0 ? (
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
                ) : null}

                {upcomingTasks.length > 0 ? (
                  <div className="border-t border-line px-6 py-4">
                    <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                      Diese Woche relevant
                    </p>
                    <ul className="space-y-2">
                      {upcomingTasks.map((task) => (
                        <li key={task.id} className="flex items-center justify-between gap-3">
                          <p className="truncate text-[13px] font-medium text-ink">{task.title || 'Ohne Titel'}</p>
                          <p className="shrink-0 text-[12px] text-muted">
                            {formatDeadline(task.deadline)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </DataCard>

          {/* Offene Zuständigkeiten */}
          <DataCard
            title="Offene Zuständigkeiten"
            icon={ClockIcon}
            noPadding
            action={<Button size="sm" variant="ghost" iconRight={ArrowRightIcon} onClick={() => onNavigate('tasks')}>Prüfen</Button>}
          >
            <div className="border-b border-line px-6 py-3">
              <p className="text-[12.5px] leading-relaxed text-muted">
                Aufgaben, bei denen noch keine verantwortliche Person hinterlegt ist.
              </p>
            </div>

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
        </aside>
      </div>
    </div>
  )
}