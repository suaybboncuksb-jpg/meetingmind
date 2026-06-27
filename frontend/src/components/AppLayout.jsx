import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Logo from './Logo.jsx'
import { MenuIcon, SparklesIcon } from './icons.jsx'

/**
 * AppLayout – Premium App-Shell mit Sidebar, Mobile-Drawer,
 * glassy Topbar und ruhigem SaaS-Hintergrund.
 */
export default function AppLayout({ user, current, onNavigate, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials =
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'MM'

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'MeetingMind Nutzer'

  const navigate = (key) => {
    onNavigate(key)
    setMobileOpen(false)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[280px] top-[-160px] h-[360px] w-[360px] rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-120px] h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(30,111,181,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.36),transparent_26%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(75,150,212,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_26%)]" />
      </div>

      {/* Desktop-Sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden p-4 lg:block">
        <Sidebar current={current} onNavigate={onNavigate} />
      </div>

      {/* Mobile-Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/45 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 p-3">
            <Sidebar current={current} onNavigate={navigate} />
          </div>
        </div>
      )}

      <div className="relative z-10 lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/72 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-line bg-surface p-2 text-muted shadow-soft transition hover:bg-soft hover:text-ink lg:hidden"
                aria-label="Menü öffnen"
              >
                <MenuIcon size={20} />
              </button>
              <span className="lg:hidden">
                <Logo size={28} />
              </span>

              <div className="hidden items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-[12.5px] font-medium text-muted shadow-soft md:flex">
                <SparklesIcon size={15} className="text-brand" />
                KI-gestützte Meeting-Nachbereitung
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[13px] font-semibold text-ink">{displayName}</p>
                <p className="text-[12px] text-muted">{user?.email}</p>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy text-[12px] font-semibold text-white shadow-soft">
                {initials}
              </span>

              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-line bg-surface px-3 py-2 text-[13px] font-semibold text-muted shadow-soft transition hover:bg-soft hover:text-ink"
              >
                Abmelden
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
