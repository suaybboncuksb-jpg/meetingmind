import { useEffect, useState } from 'react'
import api from '../api/client.js'
import PageHeader from '../components/ui/PageHeader.jsx'
import DataCard from '../components/ui/DataCard.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Button from '../components/ui/Button.jsx'
import ErrorAlert from '../components/ui/ErrorAlert.jsx'
import { UserIcon, GlobeIcon, BellIcon, PlugIcon, UsersIcon, ShieldIcon } from '../components/icons.jsx'

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

function PlannedBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/[0.06] px-2.5 py-1 text-[11px] font-medium text-brand">
      Geplant
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
    return 'Kann Organisationseinstellungen verwalten und Teammitglieder einladen.'
  }

  if (value === 'MANAGER') {
    return 'Kann Besprechungen, Aufgaben und Mandate im Team koordinieren.'
  }

  return 'Kann Besprechungen, Aufgaben und eigene Arbeitsbereiche nutzen.'
}

function initialsOf(member) {
  const initials = `${member?.firstName?.[0] ?? ''}${member?.lastName?.[0] ?? ''}`.toUpperCase()
  return initials || String(member?.email || 'MM').slice(0, 2).toUpperCase()
}

const PLANNED_INTEGRATIONS = [
  {
    name: 'Kalender-Integration',
    desc: 'Geplant: Besprechungen später mit externen Kalendern synchronisieren.',
  },
  {
    name: 'E-Mail-Versand',
    desc: 'Geplant: Einladungen und Nachbereitungen direkt per E-Mail versenden.',
  },
  {
    name: 'Dokumentenexport',
    desc: 'Geplant: Aktennotizen und Aufgaben als PDF oder Word exportieren.',
  },
]

export default function Settings({ user, theme = 'light', onThemeChange }) {
  const [language, setLanguage] = useState('de')
  const [emailNotif, setEmailNotif] = useState(true)
  const [taskNotif, setTaskNotif] = useState(true)
  const [meetingNotif, setMeetingNotif] = useState(true)
  const [team, setTeam] = useState(null)
  const [loadingTeam, setLoadingTeam] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [inviting, setInviting] = useState(false)
  const [teamError, setTeamError] = useState('')
  const [teamSuccess, setTeamSuccess] = useState('')

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'MM'
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'MeetingMind Nutzer'
  const workspaceName = team?.workspaceName || user?.workspaceName || 'Mein Arbeitsbereich'
  const userRole = roleLabel(user?.role)

  async function loadTeam() {
    setLoadingTeam(true)
    setTeamError('')
    setTeamSuccess('')

    try {
      const res = await api.get('/team')
      setTeam(res.data)
    } catch {
      setTeamSuccess('')
      setTeamError('Teamdaten konnten nicht geladen werden. Bitte versuche es später erneut.')
    } finally {
      setLoadingTeam(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [])

  async function handleInvite(e) {
    e.preventDefault()

    const cleanEmail = inviteEmail.trim()

    if (!cleanEmail) {
      setTeamSuccess('')
      setTeamError('Bitte eine E-Mail-Adresse eingeben.')
      return
    }

    setInviting(true)
    setTeamError('')
    setTeamSuccess('')

    try {
      const res = await api.post('/team/invitations', {
        email: cleanEmail,
        role: inviteRole,
      })

      setTeam((prev) => ({
        workspaceName,
        members: prev?.members || [],
        invitations: [res.data, ...(prev?.invitations || [])],
      }))

      setInviteEmail('')
      setInviteRole('MEMBER')
      setTeamError('')
      setTeamSuccess(`Einladung für ${cleanEmail} wurde erstellt.`)
    } catch {
      setTeamSuccess('')
      setTeamError('Einladung konnte nicht erstellt werden. Bitte versuche es später erneut.')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Einstellungen"
        subtitle="Passe Profil, Organisation, Teamzugriffe und Benachrichtigungen zentral an."
        badge="Arbeitsbereich"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DataCard title="Profil" icon={UserIcon}>
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy text-[16px] font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-ink">{fullName}</p>
              <p className="truncate text-[13px] text-muted">{user?.email}</p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-line rounded-card border border-line bg-canvas">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-[13px] text-muted">Rolle</span>
              <span className="rounded-full border border-brand/15 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                {userRole}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-[13px] text-muted">Arbeitsbereich</span>
              <span className="truncate text-[13px] font-medium text-ink">{workspaceName}</span>
            </div>
          </div>

          <div className="mt-4">
            <Button size="sm" variant="secondary" disabled>
              Profil bearbeiten
            </Button>
          </div>
        </DataCard>

        <DataCard title="Organisation" icon={UsersIcon}>
          <div className="rounded-card border border-line bg-canvas p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold text-ink">{workspaceName}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Gemeinsamer Arbeitsbereich für Besprechungen, Aufgaben, Fristen und Aktennotizen.
                </p>
              </div>
              <ActiveBadge />
            </div>
          </div>

          <div className="mt-4 divide-y divide-line">
            <Row title="Deine Rolle" description={roleDescription(user?.role)}>
              <span className="rounded-full border border-brand/15 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                {userRole}
              </span>
            </Row>

            <Row
              title="Teammitglieder"
              description={
                loadingTeam
                  ? 'Teamdaten werden geladen…'
                  : `${team?.members?.length || 1} aktive Person(en) im Arbeitsbereich.`
              }
            >
              <span className="rounded-full border border-line bg-soft px-2.5 py-1 text-[11px] font-semibold text-muted">
                {team?.members?.length || 1}
              </span>
            </Row>
          </div>
        </DataCard>

        <DataCard title="Team & Rollen" icon={UsersIcon}>
          <p className="mb-4 text-[13px] leading-relaxed text-muted">
            Verwalte Mitglieder, Rollen und Zugriffe innerhalb deines Arbeitsbereichs.
          </p>

          <ErrorAlert message={teamError} />

          {teamSuccess && (
            <div className="mb-4 rounded-button border border-emerald-100 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
              {teamSuccess}
            </div>
          )}

          <form onSubmit={handleInvite} className="mt-2 rounded-card border border-line bg-canvas p-4">
            <p className="text-[14px] font-semibold text-ink">Neue Einladung</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              Erstelle eine offene Einladung für den aktuellen Arbeitsbereich. Der E-Mail-Versand wird später angebunden.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px]">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="kollege@firma.de"
                className="rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/12"
              />

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-button border border-line bg-surface px-3.5 py-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12"
              >
                <option value="MEMBER">Mitglied</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="mt-3 flex justify-end">
              <Button type="submit" size="sm" disabled={inviting}>
                {inviting ? 'Wird eingeladen…' : 'Einladung erstellen'}
              </Button>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Aktive Mitglieder</p>

            <ul className="mt-2 divide-y divide-line rounded-card border border-line bg-canvas">
              {(team?.members?.length ? team.members : [{
                id: user?.id || 'me',
                email: user?.email,
                firstName: user?.firstName,
                lastName: user?.lastName,
                role: user?.role,
              }]).map((member) => (
                <li key={member.id || member.email} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-[12px] font-semibold text-navy">
                    {initialsOf(member)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {[member.firstName, member.lastName].filter(Boolean).join(' ') || member.email}
                    </p>
                    <p className="truncate text-[12.5px] text-muted">{member.email}</p>
                  </div>

                  <span className="rounded-full border border-brand/15 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                    {roleLabel(member.role)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Offene Einladungen</p>

            {team?.invitations?.length ? (
              <ul className="mt-2 divide-y divide-line rounded-card border border-line bg-canvas">
                {team.invitations.map((invitation) => (
                  <li key={invitation.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">{invitation.email}</p>
                      <p className="truncate text-[12.5px] text-muted">
                        Rolle: {roleLabel(invitation.role)} · Status: {invitation.status}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      Offen
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 rounded-button border border-line bg-canvas px-3 py-3 text-[12.5px] text-muted">
                Noch keine offenen Einladungen.
              </p>
            )}
          </div>
        </DataCard>

        <div className="space-y-6">
          <DataCard title="Sprache & Darstellung" icon={GlobeIcon}>
            <div className="divide-y divide-line">
              <Row title="Sprache" description="Sprache der Oberfläche.">
                <Tabs
                  tabs={[{ key: 'de', label: 'Deutsch' }, { key: 'en', label: 'English' }]}
                  value={language}
                  onChange={setLanguage}
                />
              </Row>
              <Row title="Darstellung" description="Helles oder dunkles Erscheinungsbild.">
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
              <Row title="Fristenerinnerungen" description="Erhalte Hinweise zu anstehenden Fristen und offenen Aufgaben.">
                <Toggle checked={taskNotif} onChange={setTaskNotif} />
              </Row>
              <Row title="Besprechungszusammenfassungen" description="Erhalte Zusammenfassungen nach analysierten Besprechungen.">
                <Toggle checked={meetingNotif} onChange={setMeetingNotif} />
              </Row>
              <Row title="E-Mail-Benachrichtigungen" description="Zusätzlich per E-Mail informiert werden.">
                <Toggle checked={emailNotif} onChange={setEmailNotif} />
              </Row>
            </div>
          </DataCard>
        </div>

        <DataCard title="Datenschutz & Sicherheit" icon={ShieldIcon}>
          <p className="mb-4 text-[13px] leading-relaxed text-muted">
            Verwalte sicherheitsrelevante Einstellungen für deinen Arbeitsbereich.
          </p>

          <div className="divide-y divide-line">
            <Row title="Zugriff & Rollen" description="Steuere, wer Besprechungen und Mandate einsehen darf.">
              <PlannedBadge />
            </Row>
            <Row title="Vertrauliche Besprechungsdaten" description="Kennzeichne Besprechungen mit besonders sensiblen Inhalten.">
              <PlannedBadge />
            </Row>
            <Row title="Datenexport" description="Exportiere deine Daten als strukturierte Datei.">
              <PlannedBadge />
            </Row>
            <Row title="Löschoptionen" description="Lösche einzelne Besprechungen oder Aufgaben dauerhaft.">
              <PlannedBadge />
            </Row>
          </div>
        </DataCard>

        <DataCard title="Integrationen" icon={PlugIcon}>
          <div className="mb-3 rounded-xl border border-line bg-canvas px-4 py-3">
            <p className="text-[13px] leading-relaxed text-muted">
              Geplante Anbindungen für Kalender, E-Mail, Dokumentenexport und externe Systeme.
            </p>
          </div>

          <div className="divide-y divide-line">
            {PLANNED_INTEGRATIONS.map((it) => (
              <Row key={it.name} title={it.name} description={it.desc}>
                <PlannedBadge />
              </Row>
            ))}
          </div>
        </DataCard>
      </div>
    </div>
  )
}