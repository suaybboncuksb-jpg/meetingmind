import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader.jsx'
import DataCard from '../components/ui/DataCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Button from '../components/ui/Button.jsx'
import { CheckSquareIcon, PlusIcon, SparklesIcon, ArrowRightIcon } from '../components/icons.jsx'
import {
  isUnassignedTask,
  assigneeDisplayLabel,
  deadlineLabel,
  deadlineBadgeClass,
  formatDeadline,
  getDeadlineState,
} from '../lib/tasks.js'
import { matchesSearch } from '../lib/search.js'

const STATUS_TABS = [
  { key: 'all', label: 'Alle' },
  { key: 'OPEN', label: 'Offen' },
  { key: 'IN_PROGRESS', label: 'In Bearbeitung' },
  { key: 'DONE', label: 'Erledigt' },
]

const DEADLINE_TABS = [
  { key: 'all', label: 'Alle Fristen' },
  { key: 'overdue', label: 'Überfällig' },
  { key: 'today', label: 'Heute' },
  { key: 'this_week', label: 'Diese Woche' },
  { key: 'none', label: 'Ohne Frist' },
]

const PRIORITY = {
  HIGH: { label: 'Hoch', className: 'border-red-200 bg-red-50 text-red-700' },
  MEDIUM: { label: 'Mittel', className: 'border-blue-200 bg-blue-50 text-brand' },
  LOW: { label: 'Niedrig', className: 'border-line bg-soft text-muted' },
}

function PriorityBadge({ priority }) {
  const meta = PRIORITY[priority] || PRIORITY.MEDIUM

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.className}`}>
      {meta.label}
    </span>
  )
}

function DeadlineBadge({ task }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${deadlineBadgeClass(task)}`}>
        {deadlineLabel(task)}
      </span>
      <span className="text-[12px] text-muted">{formatDeadline(task.deadline)}</span>
      {task.deadlineEstimated ? (
        <span className="text-[10.5px] font-semibold text-brand">KI-Schätzung</span>
      ) : null}
    </div>
  )
}

/** Kleiner Hinweis-Pill, falls die Aufgabe ein noch unbestätigter KI-Vorschlag ist. */
function AiSuggestionPill({ task }) {
  if (!task.aiGenerated || task.confirmed) return null

  return (
    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10.5px] font-semibold text-brand">
      KI-Vorschlag · zu bestätigen
    </span>
  )
}

export default function Tasks({
  tasks = [],
  onStatusChange,
  onNewTask,
  onNavigate,
  onOpenTask,
}) {
  const [status, setStatus] = useState('all')
  const [deadlineFilter, setDeadlineFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(
    () => tasks.filter((task) => {
      const matchesStatus = status === 'all' || task.status === status
      const matchesDeadline = deadlineFilter === 'all' || getDeadlineState(task) === deadlineFilter
      const matchesQuery = matchesSearch(searchQuery, [
        task.title,
        task.meetingTitle,
        task.projectName,
        task.assigneeName,
        task.aiSuggestedAssigneeName,
        task.status,
        task.priority,
        task.deadline,
      ])

      return matchesStatus && matchesDeadline && matchesQuery
    }),
    [tasks, status, deadlineFilter, searchQuery],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aufgaben & Fristen"
        subtitle="Alle Aufgaben, Fristen und Zuständigkeiten aus Besprechungen zentral im Blick."
        actions={<Button icon={PlusIcon} onClick={onNewTask}>Aufgabe / Frist anlegen</Button>}
      />

      <div className="space-y-3">
        <Tabs tabs={STATUS_TABS} value={status} onChange={setStatus} />

        <div className="rounded-card border border-line bg-surface p-4 shadow-soft">
          <label htmlFor="task-search" className="mb-1.5 block text-[13px] font-medium text-ink">
            Aufgaben durchsuchen
          </label>
          <input
            id="task-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Aufgaben durchsuchen nach Titel, Mandant, Aktenzeichen, Besprechung, Zuständigkeit oder Priorität…"
            className="w-full rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[12.5px] font-semibold text-muted">Fristenfokus:</span>
          {DEADLINE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setDeadlineFilter(tab.key)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition ${
                deadlineFilter === tab.key
                  ? 'bg-navy text-white shadow-soft'
                  : 'border border-line bg-surface text-muted hover:bg-soft hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <DataCard noPadding>
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquareIcon}
            title="Noch keine Aufgaben"
            description="Lege eine Aufgabe oder Frist an, oder analysiere ein Besprechungsprotokoll mit KI."
            action={
              <div className="flex gap-2">
                <Button size="sm" icon={PlusIcon} onClick={onNewTask}>Aufgabe / Frist anlegen</Button>
                <Button size="sm" variant="secondary" icon={SparklesIcon} onClick={() => onNavigate('meetings')}>Besprechung analysieren</Button>
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[14px] text-muted">
            {searchQuery ? 'Keine passenden Aufgaben gefunden.' : 'Keine Aufgaben für diesen Filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-line text-[12px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-3">Aufgabe</th>
                  <th className="px-6 py-3">Besprechung / Mandat</th>
                  <th className="px-6 py-3">Zuständige Person</th>
                  <th className="px-6 py-3">Frist</th>
                  <th className="px-6 py-3">Priorität</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aktionen / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((task) => {
                  const unassigned = isUnassignedTask(task) && task.status !== 'DONE'
                  const label = assigneeDisplayLabel(task)

                  return (
                    <tr
                      key={task.id}
                      className="cursor-pointer hover:bg-canvas"
                      onClick={() => onOpenTask(task.id)}
                    >
                      <td className="px-6 py-3 font-medium text-ink">
                        <div className="flex flex-col">
                          {task.title}
                          <AiSuggestionPill task={task} />
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted">{task.meetingTitle || '—'}</span>
                          {task.projectName ? (
                            <span className="w-fit rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                              {task.projectName}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {unassigned && !label ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                            Keine zuständige Person
                          </span>
                        ) : (
                          <span className={task.assigneeName ? 'text-muted' : 'text-brand'}>
                            {label || '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3"><DeadlineBadge task={task} /></td>
                      <td className="px-6 py-3"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-6 py-3" onClick={(event) => event.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(event) => onStatusChange(task.id, event.target.value)}
                          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] font-medium text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                        >
                          <option value="OPEN">Offen</option>
                          <option value="IN_PROGRESS">In Bearbeitung</option>
                          <option value="DONE">Erledigt</option>
                        </select>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          iconRight={ArrowRightIcon}
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpenTask(task.id)
                          }}
                        >
                          Öffnen
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>
    </div>
  )
}