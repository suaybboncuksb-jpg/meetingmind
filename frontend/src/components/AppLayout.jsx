import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Logo from './Logo.jsx'
import { MenuIcon } from './icons.jsx'

/**
 * AppLayout – Premium App-Shell mit Sidebar, Mobile-Drawer,
 * glassy Topbar und ruhigem SaaS-Hintergrund.
 */
export default function AppLayout({ user, current, onNavigate, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigate = (key) => {
    onNavigate(key)
    setMobileOpen(false)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[280px] top-[-160px] h-[360px] w-[360px] rounded-full bg-[#eadfce]/45 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-120px] h-[420px] w-[420px] rounded-full bg-[#ded6c8]/40 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,223,206,0.34),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(222,214,200,0.28),transparent_32%),linear-gradient(180deg,#fbfaf8_0%,#f8f7f5_42%,#f1efeb_100%)] before:absolute before:inset-0 before:bg-[radial-gradient(circle,rgba(13,33,55,0.035)_1px,transparent_1px)] before:[background-size:18px_18px] before:opacity-[0.22] dark:bg-[radial-gradient(circle_at_top_left,rgba(75,150,212,0.10),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_26%)] dark:before:hidden" />
      </div>

      {/* Desktop-Sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden p-4 lg:block">
        <Sidebar current={current} onNavigate={onNavigate} user={user} onLogout={onLogout} />
      </div>

      {/* Mobile-Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/45 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 p-3">
            <Sidebar current={current} onNavigate={navigate} user={user} onLogout={onLogout} />
          </div>
        </div>
      )}

      <div className="relative z-10 lg:pl-72">
        {/* Mobile-Header (nur < lg sichtbar, kein Desktop-Balken mehr) */}
        <header className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-line bg-surface p-2 text-muted shadow-soft transition hover:bg-soft hover:text-ink"
            aria-label="Menü öffnen"
          >
            <MenuIcon size={20} />
          </button>
          <Logo size={28} />
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
