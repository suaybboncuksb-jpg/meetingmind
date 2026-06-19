import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Logo from './Logo.jsx'
import { MenuIcon } from './icons.jsx'

/**
 * AppLayout – App-Shell mit fester Sidebar (Desktop), Mobile-Drawer,
 * sticky Topbar (Account rechts) und zentriertem Content-Bereich.
 */
export default function AppLayout({ user, current, onNavigate, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials =
    `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'MM'

  const navigate = (key) => {
    onNavigate(key)
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop-Sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar current={current} onNavigate={onNavigate} />
      </div>

      {/* Mobile-Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-card">
            <Sidebar current={current} onNavigate={navigate} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-muted transition hover:bg-soft hover:text-ink lg:hidden"
                aria-label="Menü öffnen"
              >
                <MenuIcon size={20} />
              </button>
              <span className="lg:hidden">
                <Logo size={28} />
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-[13px] text-muted sm:inline">{user?.email}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-[12px] font-semibold text-white">
                {initials}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg px-3 py-1.5 text-[14px] font-medium text-muted transition hover:bg-soft hover:text-ink"
              >
                Abmelden
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
