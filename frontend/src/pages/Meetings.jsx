import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader.jsx'
import DataCard from '../components/ui/DataCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import StatusBadge from '../components/ui/StatusBadge.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Button from '../components/ui/Button.jsx'
import MeetingDetail from '../components/MeetingDetail.jsx'
import { PlusIcon, CalendarIcon, FileTextIcon, UsersIcon, CheckSquareIcon, ArrowRightIcon } from '../components/icons.jsx'
import { formatDate, meetingDateOf, taskCountOf, sortByDateDesc } from '../lib/meetings.js'
import { matchesSearch } from '../lib/search.js'

const TABS = [
  { key: 'all', label: 'Alle Meetings' },
  { key: 'calendar', label: 'Kalenderansicht' },
  { key: 'drafts', label: 'Entwürfe' },
]

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function MeetingRow({ meeting, onOpen }) {
  return (
    <li className="flex flex-col gap-3 px-6 py-4 transition hover:bg-canvas sm:flex-row sm:items-center">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-navy">
        <FileTextIcon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[14px] font-medium text-ink">{meeting.title || 'Ohne Titel'}</p>
          {meeting.projectName ? (
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
              {meeting.projectName}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1.5"><CalendarIcon size={14} />{formatDate(meetingDateOf(meeting))}</span>
          <span className="inline-flex items-center gap-1.5"><UsersIcon size={14} />— Teilnehmer</span>
          <span className="inline-flex items-center gap-1.5"><CheckSquareIcon size={14} />{taskCountOf(meeting)} Aufgaben</span>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:justify-end">
        <StatusBadge status={meeting.status} />
        <Button size="sm" variant="secondary" iconRight={ArrowRightIcon} onClick={() => onOpen(meeting)}>
          Details ansehen
        </Button>
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

export default function Meetings({ meetings = [], loading, onNewMeeting, onMeetingUpdated }) {
  const [tab, setTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)

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
  const selected = meetings.find((m) => m.id === selectedId) || null

  const list = tab === 'drafts' ? drafts : searchableMeetings

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        subtitle="Alle Meetings, Kalenderansicht und Entwürfe an einem Ort."
        actions={<Button icon={PlusIcon} onClick={onNewMeeting}>Neues Meeting</Button>}
      />

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="rounded-card border border-line bg-surface p-4 shadow-soft">
        <label htmlFor="meeting-search" className="mb-1.5 block text-[13px] font-medium text-ink">
          Meetings durchsuchen
        </label>
        <input
          id="meeting-search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Suche nach Titel, Projekt/Kunde, Beschreibung oder Status…"
          className="w-full rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12"
        />
      </div>

      <DataCard noPadding>
        {loading ? (
          <div className="px-6 py-12 text-center text-[14px] text-muted">Wird geladen…</div>
        ) : tab === 'calendar' ? (
          searchableMeetings.length === 0 ? (
            <EmptyState icon={CalendarIcon} title="Noch keine Meetings" description="Erstelle ein Meeting, um es im Kalender zu sehen."
              action={<Button size="sm" variant="secondary" icon={PlusIcon} onClick={onNewMeeting}>Meeting erstellen</Button>} />
          ) : (
            <CalendarView meetings={searchableMeetings} onOpen={(m) => setSelectedId(m.id)} />
          )
        ) : list.length === 0 ? (
          <EmptyState
            icon={tab === 'drafts' ? FileTextIcon : CalendarIcon}
            title={searchQuery ? 'Keine passenden Meetings' : (tab === 'drafts' ? 'Keine Entwürfe' : 'Noch keine Meetings')}
            description={searchQuery ? 'Passe deine Suche an oder entferne den Suchbegriff.' : (tab === 'drafts' ? 'Entwürfe erscheinen hier, bis sie analysiert wurden.' : 'Erstelle dein erstes Meeting, um loszulegen.')}
            action={<Button size="sm" variant="secondary" icon={PlusIcon} onClick={onNewMeeting}>Meeting erstellen</Button>}
          />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((m) => <MeetingRow key={m.id} meeting={m} onOpen={(mm) => setSelectedId(mm.id)} />)}
          </ul>
        )}
      </DataCard>

      {selected && (
        <MeetingDetail
          meeting={selected}
          onClose={() => setSelectedId(null)}
          onUpdated={(updated) => { onMeetingUpdated?.(updated); }}
        />
      )}
    </div>
  )
}
