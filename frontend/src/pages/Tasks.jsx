import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader.jsx'
import DataCard from '../components/ui/DataCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Button from '../components/ui/Button.jsx'
import { CheckSquareIcon, PlusIcon, SparklesIcon } from '../components/icons.jsx'

const STATUS_TABS = [
  { key: 'all', label: 'Alle' },
  { key: 'OPEN', label: 'Offen' },
  { key: 'IN_PROGRESS', label: 'In Arbeit' },
  { key: 'DONE', label: 'Erledigt' },
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

export default function Tasks({ tasks = [], onStatusChange, onNewTask, onNavigate }) {
  const [status, setStatus] = useState('all')

  const filtered = useMemo(
    () => (status === 'all' ? tasks : tasks.filter((t) => t.status === status)),
    [tasks, status],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aufgaben"
        subtitle="Alle Action Items aus deinen Meetings – zentral an einem Ort."
        actions={<Button icon={PlusIcon} onClick={onNewTask}>Neue Aufgabe</Button>}
      />

      <Tabs tabs={STATUS_TABS} value={status} onChange={setStatus} />

      <DataCard noPadding>
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquareIcon}
            title="Noch keine Aufgaben"
            description="Lege eine Aufgabe an oder analysiere ein Meeting-Protokoll mit KI."
            action={
              <div className="flex gap-2">
                <Button size="sm" icon={PlusIcon} onClick={onNewTask}>Neue Aufgabe</Button>
                <Button size="sm" variant="secondary" icon={SparklesIcon} onClick={() => onNavigate('meetings')}>Meeting analysieren</Button>
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-[14px] text-muted">Keine Aufgaben in diesem Status.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-line text-[12px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-3">Aufgabe</th>
                  <th className="px-6 py-3">Meeting</th>
                  <th className="px-6 py-3">Zuständig</th>
                  <th className="px-6 py-3">Deadline</th>
                  <th className="px-6 py-3">Priorität</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-canvas">
                    <td className="px-6 py-3 font-medium text-ink">{t.title}</td>
                    <td className="px-6 py-3 text-muted">{t.meetingTitle || '—'}</td>
                    <td className="px-6 py-3 text-muted">{t.assignee || '—'}</td>
                    <td className="px-6 py-3 text-muted">{t.deadline || '—'}</td>
                    <td className="px-6 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-6 py-3">
                      <select
                        value={t.status}
                        onChange={(e) => onStatusChange(t.id, e.target.value)}
                        className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] font-medium text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                      >
                        <option value="OPEN">Offen</option>
                        <option value="IN_PROGRESS">In Arbeit</option>
                        <option value="DONE">Erledigt</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>
    </div>
  )
}
