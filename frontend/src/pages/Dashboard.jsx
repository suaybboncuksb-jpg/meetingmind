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
  priorityLabel,
  getDeadlineRadarTasks,
  getDeadlineStats,
  deadlineLabel,
  deadlineBadgeClass,
  formatDeadline,
} from '../lib/tasks.js'

export default function Dashboard({ user, meetings = [], tasks = [], loading, onNewMeeting, onNavigate }) {
  const stats = useMemo(() => deriveStats(meetings, tasks), [meetings, tasks])
  const recent = useMemo(() => sortByDateDesc(meetings).slice(0, 5), [meetings])
  const unassignedTasks = useMemo(() => getUnassignedTasks(tasks), [tasks])
  const visibleUnassignedTasks = useMemo(() => unassignedTasks.slice(0, 5), [unassignedTasks])
  const deadlineRadarTasks = useMemo(() => getDeadlineRadarTasks(tasks), [tasks])
  const visibleDeadlineRadarTasks = useMemo(() => deadlineRadarTasks.slice(0, 5), [deadlineRadarTasks])
  const deadlineStats = useMemo(() => getDeadlineStats(tasks), [tasks])
  const firstName = user?.firstName || 'zurück'

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Guten Tag, ${firstName}`}
        subtitle="Überblick über deine Meetings, Aufgaben und KI-Analysen."
        actions={<Button icon={PlusIcon} onClick={onNewMeeting}>Neues Meeting</Button>}
      />

      {/* KPI-Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarIcon} label="Meetings gesamt" value={stats.total} accent="bg-navy/5 text-navy" />
        <StatCard icon={SparklesIcon} label="KI-analysiert" value={stats.analyzed} accent="bg-brand/10 text-brand" />
        <StatCard icon={CheckCircleIcon} label="Offene Aufgaben" value={stats.openTasks} accent="bg-soft text-muted" />
        <StatCard icon={ClockIcon} label="Ohne Zuständige" value={unassignedTasks.length} accent="bg-amber-50 text-amber-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Letzte Meetings */}
        <div className="lg:col-span-2">
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
                {recent.map((m) => (
                  <li key={m.id} className="flex items-center gap-4 px-6 py-4 transition hover:bg-canvas">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-navy">
                      <FileTextIcon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">{m.title || 'Ohne Titel'}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-muted">
                        {formatDate(meetingDateOf(m))}
                        {m.description ? ` · ${m.description}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={m.status} />
                  </li>
                ))}
              </ul>
            )}
          </DataCard>
        </div>

        {/* Deadline-Radar und Aufgaben ohne Zuständige */}
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

                {deadlineRadarTasks.length > 5 && (
                  <div className="border-t border-line px-6 py-3 text-[12.5px] text-muted">
                    + {deadlineRadarTasks.length - 5} weitere kritische Aufgaben
                  </div>
                )}
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
                          {task.deadline ? ` · Deadline: ${task.deadline}` : ''}
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
              Lege ein Meeting an oder analysiere ein Protokoll mit KI.
            </p>
            <div className="relative mt-5 flex flex-col gap-2">
              <button
                onClick={onNewMeeting}
                className="inline-flex items-center justify-center gap-2 rounded-button bg-white px-4 py-2.5 text-[13px] font-semibold text-navy transition hover:bg-white/90"
              >
                <PlusIcon size={16} /> Neues Meeting erstellen
              </button>
              <button
                onClick={() => onNavigate('meetings')}
                className="inline-flex items-center justify-center gap-2 rounded-button border border-white/15 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                <SparklesIcon size={16} /> Protokoll analysieren
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
