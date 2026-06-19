import Logo from './Logo.jsx'
import { HomeIcon, VideoIcon, CheckSquareIcon, SettingsIcon } from './icons.jsx'

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { key: 'meetings', label: 'Meetings', icon: VideoIcon },
  { key: 'tasks', label: 'Aufgaben', icon: CheckSquareIcon },
  { key: 'settings', label: 'Einstellungen', icon: SettingsIcon },
]

export default function Sidebar({ current, onNavigate }) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-line bg-surface">
      <div className="px-6 py-5">
        <Logo size={30} />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = current === item.key
          const IconCmp = item.icon
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              aria-current={active ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-[14px] font-medium transition ${
                active ? 'bg-navy/[0.06] text-navy' : 'text-muted hover:bg-soft hover:text-ink'
              }`}
            >
              <IconCmp size={19} className={active ? 'text-brand' : ''} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="px-6 py-4 text-[11px] text-muted/70">
        © {new Date().getFullYear()} MeetingMind
      </div>
    </aside>
  )
}
