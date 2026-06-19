import { useState } from 'react'
import PageHeader from '../components/ui/PageHeader.jsx'
import DataCard from '../components/ui/DataCard.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import { UserIcon, GlobeIcon, BellIcon, PlugIcon } from '../components/icons.jsx'

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-navy' : 'bg-line'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

function Row({ title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-ink">{title}</p>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const INTEGRATIONS = [
  { name: 'Google Calendar', desc: 'Meetings automatisch synchronisieren.' },
  { name: 'Zoom', desc: 'Aufzeichnungen & Transkripte importieren.' },
  { name: 'Microsoft Teams', desc: 'Meetings und Protokolle verbinden.' },
]

export default function Settings({ user, theme = 'light', onThemeChange }) {
  const [language, setLanguage] = useState('de')
  const [emailNotif, setEmailNotif] = useState(true)
  const [taskNotif, setTaskNotif] = useState(true)

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'MM'
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'MeetingMind User'

  return (
    <div className="space-y-6">
      <PageHeader title="Einstellungen" subtitle="Verwalte dein Profil, Präferenzen und Integrationen." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profil */}
        <DataCard title="Profil" icon={UserIcon}>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-[16px] font-semibold text-white">
              {initials}
            </span>
            <div>
              <p className="text-[15px] font-semibold text-ink">{fullName}</p>
              <p className="text-[13px] text-muted">{user?.email}</p>
            </div>
          </div>
        </DataCard>

        {/* Sprache & Design */}
        <DataCard title="Sprache & Darstellung" icon={GlobeIcon}>
          <div className="divide-y divide-line">
            <Row title="Sprache" description="Sprache der Oberfläche.">
              <Tabs
                tabs={[{ key: 'de', label: 'Deutsch' }, { key: 'en', label: 'English' }]}
                value={language}
                onChange={setLanguage}
              />
            </Row>
            <Row title="Designmodus" description="Wähle zwischen hellem und dunklem Erscheinungsbild.">
              <Tabs
                tabs={[{ key: 'light', label: 'Hell' }, { key: 'dark', label: 'Dunkel' }]}
                value={theme}
                onChange={(v) => onThemeChange?.(v)}
              />
            </Row>
          </div>
        </DataCard>

        {/* Benachrichtigungen */}
        <DataCard title="Benachrichtigungen" icon={BellIcon}>
          <div className="divide-y divide-line">
            <Row title="E-Mail-Benachrichtigungen" description="Zusammenfassungen nach jedem Meeting.">
              <Toggle checked={emailNotif} onChange={setEmailNotif} />
            </Row>
            <Row title="Aufgaben-Erinnerungen" description="Hinweise zu fälligen Aufgaben.">
              <Toggle checked={taskNotif} onChange={setTaskNotif} />
            </Row>
          </div>
        </DataCard>

        {/* Integrationen */}
        <DataCard title="Integrationen" icon={PlugIcon}>
          <div className="divide-y divide-line">
            {INTEGRATIONS.map((it) => (
              <Row key={it.name} title={it.name} description={it.desc}>
                <span className="inline-flex items-center rounded-full border border-line bg-soft px-2.5 py-1 text-[11px] font-medium text-muted">
                  Bald verfügbar
                </span>
              </Row>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  )
}
