import Logo from './Logo.jsx'
import { HomeIcon, VideoIcon, CheckSquareIcon, SettingsIcon, SparklesIcon } from './icons.jsx'

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { key: 'meetings', label: 'Besprechungen', icon: VideoIcon },
  { key: 'tasks', label: 'Aufgaben & Fristen', icon: CheckSquareIcon },
  { key: 'settings', label: 'Einstellungen', icon: SettingsIcon },
]

export default function Sidebar({ current, onNavigate, user, onLogout }) {
  const initials =
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'MM'

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'MeetingMind Nutzer'

  return (
    <aside className="flex h-full w-64 flex-col overflow-hidden rounded-[28px] border border-line/80 bg-surface/86 shadow-card backdrop-blur-xl">
      <div className="border-b border-line/70 px-6 py-5">
        <Logo size={30} />
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
          Aus Besprechungen werden klare Aufgaben, Entscheidungen und Aktennotizen.
        </p>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = current === item.key
          const IconCmp = item.icon

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              aria-current={active ? 'page' : undefined}
              className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-[14px] font-semibold transition ${
                active
                  ? 'bg-navy text-white shadow-soft'
                  : 'text-muted hover:bg-soft hover:text-ink'
              }`}
            >
              {active && (
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_42%)]" />
              )}
              <span className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition ${
                active ? 'bg-white/14 text-white' : 'bg-soft text-muted group-hover:text-brand'
              }`}>
                <IconCmp size={18} />
              </span>
              <span className="relative">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="px-4 pb-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy px-4 py-4 text-white shadow-soft">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/40 blur-2xl" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
            <SparklesIcon size={18} className="text-brand" />
          </span>
          <p className="relative mt-3 text-[13px] font-semibold">Tagesfokus</p>
          <p className="relative mt-1 text-[12px] leading-relaxed text-white/70">
            Offene Aufgaben und Fristen aus aktuellen Mandaten im Blick behalten.
          </p>
        </div>
      </div>

      <div className="border-t border-line/70 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy text-[12px] font-semibold text-white shadow-soft">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">{displayName}</p>
            <p className="truncate text-[12px] text-muted">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-muted shadow-soft transition hover:bg-soft hover:text-ink"
        >
          Abmelden
        </button>
        <p className="mt-3 text-[11px] text-muted/70">
          © {new Date().getFullYear()} MeetingMind
        </p>
      </div>
    </aside>
  )
}