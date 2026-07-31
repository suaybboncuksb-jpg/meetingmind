import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader.jsx'
import DataCard from '../components/ui/DataCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Button from '../components/ui/Button.jsx'
import { PlusIcon, CalendarIcon, FileTextIcon, UsersIcon, CheckSquareIcon, ArrowRightIcon } from '../components/icons.jsx'
import { formatDate, meetingDateOf, taskCountOf, sortByDateDesc } from '../lib/meetings.js'
import { matchesSearch } from '../lib/search.js'

const TABS = [
  { key: 'all', label: 'Alle Besprechungen' },
  { key: 'calendar', label: 'Kalender' },
  { key: 'drafts', label: 'Entwürfe' },
]

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']


function MeetingMetric({ icon: Icon, label, value, description, tone = 'neutral' }) {
  const toneClass = {
    brand: 'bg-brand/10 text-brand',
    navy: 'bg-navy/5 text-navy',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    neutral: 'bg-soft text-muted',
  }[tone] || 'bg-soft text-muted'

  return (
    <div className="rounded-[24px] border border-line/80 bg-surface/86 p-5 shadow-soft backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon size={18} />
        </span>
      </div>

      <p className="mt-5 text-[30px] font-semibold tracking-[-0.045em] text-ink">{value}</p>
      <p className="mt-1 text-[13px] font-semibold text-ink">{label}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{description}</p>
    </div>
  )
}


function MeetingRow({ meeting, onOpen, onDelete }) {
  const taskCount = taskCountOf(meeting)
  const description = String(meeting.description || '').trim()
  const hasDescription = Boolean(description)
  const dateLabel = formatDate(meetingDateOf(meeting))

  return (
    <li className="rounded-[22px] border border-line bg-canvas/70 px-4 py-4 transition hover:bg-surface hover:shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy/5 text-navy">
            <FileTextIcon size={18} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-[15px] font-semibold tracking-tight text-ink">
                {meeting.title || 'Ohne Titel'}
              </p>

              {meeting.projectName ? (
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                  {meeting.projectName}
                </span>
              ) : null}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon size={14} />
                {dateLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon size={14} />
                — Teilnehmer
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckSquareIcon size={14} />
                {taskCount} Aufgabe(n)
              </span>
            </div>

            <p className="mt-2 max-w-2xl truncate text-[12.5px] leading-relaxed text-muted">
              {hasDescription ? description : 'Noch keine Agenda oder Beschreibung hinterlegt.'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 lg:justify-end">
          <StatusBadge status={meeting.status} />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (window.confirm(`„${meeting.title || 'Diese Besprechung'}“ wirklich unwiderruflich löschen?`)) {
                onDelete(meeting.id)
              }
            }}
          >
            Löschen
          </Button>
          <Button size="sm" variant="secondary" iconRight={ArrowRightIcon} onClick={() => onOpen(meeting)}>
            Details
          </Button>
        </div>
      </div>
    </li>
  )
}


function CalendarView({ meetings, onOpen }) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const byDay = useMemo(() => {
    const map = {}
    meetings.forEach((m) => {
      const d = meetingDateOf(m)
      if (!d) return
      const key = new Date(d).toDateString()
      ;(map[key] = map[key] || []).push(m)
    })
    return map
  }, [meetings])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Mo=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const monthLabel = cursor.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold capitalize text-ink">{monthLabel}</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</Button>
          <Button size="sm" variant="secondary" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Heute</Button>
          <Button size="sm" variant="secondary" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
        {WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const date = new Date(year, month, day)
          const items = byDay[date.toDateString()] || []
          const isToday = date.toDateString() === today.toDateString()
          return (
            <div key={day} className={`min-h-[88px] rounded-xl border p-2 text-left ${isToday ? 'border-brand/40 bg-brand/[0.04]' : 'border-line bg-surface'}`}>
              <span className={`text-[12px] font-medium ${isToday ? 'text-brand' : 'text-muted'}`}>{day}</span>
              <div className="mt-1 space-y-1">
                {items.slice(0, 2).map((m) => (
                  <button key={m.id} onClick={() => onOpen(m)} className="block w-full truncate rounded-md bg-navy/5 px-1.5 py-1 text-left text-[11px] font-medium text-navy hover:bg-navy/10">
                    {m.title || 'Ohne Titel'}
                  </button>
                ))}
                {items.length > 2 && <span className="text-[10px] text-muted">+{items.length - 2} weitere</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Meetings({ meetings = [], loading, onNewMeeting, onOpenMeeting, onDeleteMeeting }) {
  const [tab, setTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const sorted = useMemo(() => sortByDateDesc(meetings), [meetings])
  const searchableMeetings = useMemo(
    () => sorted.filter((meeting) => matchesSearch(searchQuery, [
      meeting.title,
      meeting.description,
      meeting.projectName,
      meeting.status,
    ])),
    [sorted, searchQuery],
  )
  const drafts = useMemo(() => searchableMeetings.filter((m) => m.status === 'DRAFT'), [searchableMeetings])

  const meetingStats = useMemo(() => {
    const analyzedStatuses = new Set(['ANALYZED', 'COMPLETED'])
    const failedStatuses = new Set(['ANALYSIS_FAILED'])

    return {
      total: sorted.length,
      drafts: sorted.filter((m) => m.status === 'DRAFT').length,
      analyzed: sorted.filter((m) => analyzedStatuses.has(String(m.status || '').toUpperCase())).length,
      failed: sorted.filter((m) => failedStatuses.has(String(m.status || '').toUpperCase())).length,
      tasks: sorted.reduce((sum, meeting) => sum + taskCountOf(meeting), 0),
    }
  }, [sorted])

  const list = tab === 'drafts' ? drafts : searchableMeetings

  return (
    <div className="space-y-6">
      <PageHeader
        title="Besprechungen"
        subtitle="Dokumentiere Mandanten- und Teambesprechungen zentral und erkenne Aufgaben, Fristen und offene Rückfragen automatisch."
        actions={<Button icon={PlusIcon} onClick={onNewMeeting}>Neue Besprechung</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MeetingMetric
          icon={CalendarIcon}
          label="Besprechungen gesamt"
          value={meetingStats.total}
          description="Gesamte Besprechungs-Historie im Workspace."
          tone="navy"
        />
        <MeetingMetric
          icon={FileTextIcon}
          label="Entwürfe"
          value={meetingStats.drafts}
          description="Besprechungen, die noch nicht analysiert wurden."
          tone={meetingStats.drafts > 0 ? 'amber' : 'neutral'}
        />
        <MeetingMetric
          icon={CheckSquareIcon}
          label="Analysierte Protokolle"
          value={meetingStats.analyzed}
          description="Besprechungen mit gespeicherter KI-Nachbereitung."
          tone="emerald"
        />
        <MeetingMetric
          icon={CheckSquareIcon}
          label="Erkannte Aufgaben"
          value={meetingStats.tasks}
          description="Erkannte oder manuell angelegte Aufgaben."
          tone="brand"
        />
      </div>

      <div className="rounded-[26px] border border-line/80 bg-surface/86 p-4 shadow-soft backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">
              Besprechungsarchiv
            </p>
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
          </div>

          <div className="w-full xl:max-w-md">
            <label htmlFor="meeting-search" className="mb-1.5 block text-[13px] font-medium text-ink">
              Besprechungen durchsuchen
            </label>
            <input
              id="meeting-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Titel, Mandant, Beschreibung oder Status…"
              className="w-full rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12"
            />
          </div>
        </div>
      </div>

      <DataCard noPadding>
        {loading ? (
          <div className="px-6 py-12 text-center text-[14px] text-muted">Wird geladen…</div>
        ) : tab === 'calendar' ? (
          searchableMeetings.length === 0 ? (
            <EmptyState icon={CalendarIcon} title="Noch keine Besprechungen erfasst" description="Erstelle eine Besprechung, um sie im Kalender zu sehen."
              action={<Button size="sm" variant="secondary" icon={PlusIcon} onClick={onNewMeeting}>Besprechung erstellen</Button>} />
          ) : (
            <CalendarView meetings={searchableMeetings} onOpen={(m) => onOpenMeeting(m.id)} />
          )
        ) : list.length === 0 ? (
          <EmptyState
            icon={tab === 'drafts' ? FileTextIcon : CalendarIcon}
            title={searchQuery ? 'Keine passenden Besprechungen' : (tab === 'drafts' ? 'Keine Entwürfe' : 'Noch keine Besprechungen erfasst')}
            description={searchQuery ? 'Passe deine Suche an oder entferne den Suchbegriff.' : (tab === 'drafts' ? 'Entwürfe erscheinen hier, bis sie analysiert wurden.' : 'Erstelle eine Besprechung oder analysiere ein Protokoll, damit MeetingMind Aufgaben, Zuständigkeiten, Fristen und offene Rückfragen erkennt.')}
            action={<Button size="sm" variant="secondary" icon={PlusIcon} onClick={onNewMeeting}>Besprechung erstellen</Button>}
          />
        ) : (
          <ul className="space-y-3 p-4 sm:p-5">
            {list.map((m) => (
              <MeetingRow
                key={m.id}
                meeting={m}
                onOpen={(mm) => onOpenMeeting(mm.id)}
                onDelete={onDeleteMeeting}
              />
            ))}
          </ul>
        )}
      </DataCard>
    </div>
  )
}