import { useState } from 'react'
import PageHeader from '../components/ui/PageHeader.jsx'
import DataCard from '../components/ui/DataCard.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import { UserIcon, GlobeIcon, BellIcon, PlugIcon, UsersIcon } from '../components/icons.jsx'

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-navy' : 'bg-line'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
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

function RoadmapBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-soft px-2.5 py-1 text-[11px] font-medium text-muted">
      Roadmap
    </span>
  )
}

function ActiveBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
      Aktiv
    </span>
  )
}

function roleLabel(role) {
  const labels = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    MEMBER: 'Mitglied',
    USER: 'Mitglied',
  }

  return labels[String(role || '').toUpperCase()] || 'Mitglied'
}

function roleDescription(role) {
  const value = String(role || '').toUpperCase()

  if (value === 'ADMIN') {
    return 'Kann Workspace-Einstellungen verwalten und später Teammitglieder einladen.'
  }

  if (value === 'MANAGER') {
    return 'Kann Meetings, Aufgaben und Projektakten im Team koordinieren.'
  }

  return 'Kann Meetings, Aufgaben und eigene Arbeitsbereiche nutzen.'
}

const ROADMAP_INTEGRATIONS = [
  {
    name: 'Kalender-Integration',
    desc: 'Geplant: Meetings später mit externen Kalendern synchronisieren.',
  },
  {
    name: 'Video-Meeting-Import',
    desc: 'Geplant: Aufzeichnungen und Transkripte aus Meeting-Tools importieren.',
  },
  {
    name: 'Team-Einladungen',
    desc: 'Geplant: Nutzer per E-Mail in einen Workspace einladen.',
  },
]

export default function Settings({ user, theme = 'light', onThemeChange }) {
  const [language, setLanguage] = useState('de')
  const [emailNotif, setEmailNotif] = useState(true)
  const [taskNotif, setTaskNotif] = useState(true)

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'MM'
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'MeetingMind User'
  const workspaceName = user?.workspaceName || 'Mein Workspace'
  const userRole = roleLabel(user?.role)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Einstellungen"
        subtitle="Verwalte Profil, Workspace, Rollen und geplante Erweiterungen."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

        <DataCard title="Team-Workspace" icon={UsersIcon}>
          <div className="rounded-card border border-line bg-canvas p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold text-ink">{workspaceName}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Gemeinsamer Arbeitsbereich für Meetings, Aufgaben, Projekte und spätere Teammitglieder.
                </p>
              </div>
              <ActiveBadge />
            </div>
          </div>

          <div className="mt-4 divide-y divide-line">
            <Row
              title="Deine Rolle"
              description={roleDescription(user?.role)}
            >
              <span className="rounded-full border border-brand/15 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                {userRole}
              </span>
            </Row>

            <Row
              title="Teammitglieder"
              description="Einladungen und Mitgliederverwaltung werden in der nächsten Ausbaustufe aktiviert."
            >
              <RoadmapBadge />
            </Row>
          </div>
        </DataCard>

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

        <DataCard title="Benachrichtigungen" icon={BellIcon}>
          <div className="divide-y divide-line">
            <Row
              title="E-Mail-Benachrichtigungen"
              description="Lokale Einstellung für spätere Meeting-Zusammenfassungen."
            >
              <Toggle checked={emailNotif} onChange={setEmailNotif} />
            </Row>
            <Row
              title="Aufgaben-Erinnerungen"
              description="Lokale Einstellung für spätere Hinweise zu fälligen Aufgaben."
            >
              <Toggle checked={taskNotif} onChange={setTaskNotif} />
            </Row>
          </div>
        </DataCard>

        <DataCard title="Roadmap" icon={PlugIcon}>
          <div className="mb-3 rounded-xl border border-line bg-canvas px-4 py-3">
            <p className="text-[13px] leading-relaxed text-muted">
              Diese Punkte sind als nächste Ausbaustufen geplant und aktuell noch nicht aktiv verbunden.
            </p>
          </div>

          <div className="divide-y divide-line">
            {ROADMAP_INTEGRATIONS.map((it) => (
              <Row key={it.name} title={it.name} description={it.desc}>
                <RoadmapBadge />
              </Row>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  )
}
