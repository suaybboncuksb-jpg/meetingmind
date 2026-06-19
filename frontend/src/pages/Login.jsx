import { useState } from 'react'
import axios from 'axios'
import Logo from '../components/Logo'

const FEATURES = [
  'Automatische Zusammenfassungen & Action Items',
  'Aufgaben mit Zuweisung und Deadline',
  'Team- und Kalenderübersicht auf einen Blick',
]

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 10.5l3.2 3.2L15 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Login({ setIsAuthenticated }) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '', name: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const switchMode = (login) => {
    setIsLogin(login)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = isLogin
        ? 'http://localhost:8080/api/auth/login'
        : 'http://localhost:8080/api/auth/register'
      const response = await axios.post(endpoint, formData)
      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      setIsAuthenticated(true)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Anmeldung fehlgeschlagen. Bitte überprüfe deine Eingaben.',
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] text-ink ' +
    'placeholder:text-muted/70 outline-none transition ' +
    'focus:border-brand focus:ring-4 focus:ring-brand/12'

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* ---------------- Linke Seite: Navy-Hero ---------------- */}
      <aside className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14">
        {/* ruhiger Hintergrund-Verlauf */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 15% 0%, #1b365d 0%, rgba(27,54,93,0) 55%), ' +
              'radial-gradient(90% 70% at 100% 100%, #16324f 0%, rgba(22,50,79,0) 60%)',
          }}
        />

        <header className="relative">
          <Logo onDark size={34} />
        </header>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-white/55">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            KI-Meeting-Management
          </span>
          <h1 className="mt-5 text-[40px] font-semibold leading-[1.1] tracking-tight text-white xl:text-[44px]">
            Meetings, die zu<br />Ergebnissen führen.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-white/65">
            MeetingMind verwandelt jedes Gespräch automatisch in klare Aufgaben,
            Verantwortlichkeiten und Deadlines – nachvollziehbar für das gesamte Team.
          </p>

          <ul className="mt-9 space-y-3.5">
            {FEATURES.map((text) => (
              <li key={text} className="flex items-center gap-3 text-[14px] text-white/80">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/90">
                  <CheckIcon />
                </span>
                {text}
              </li>
            ))}
          </ul>

          {/* Einziges Glass-/Milchglas-Element: dezente Trust-Card */}
          <figure className="mt-10 rounded-2xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
            <blockquote className="text-[14px] leading-relaxed text-white/85">
              „Unsere Meetings enden nicht mehr ohne klares Ergebnis. Jede Aufgabe
              hat einen Verantwortlichen und ein Datum.“
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[13px] font-semibold text-white">
                LK
              </span>
              <span className="text-[13px] leading-tight text-white/70">
                <span className="block font-medium text-white/90">Lena Kraus</span>
                Head of Operations, Northwind
              </span>
            </figcaption>
          </figure>
        </div>

        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} MeetingMind · Sicher & DSGVO-konform
        </p>
      </aside>

      {/* ---------------- Rechte Seite: Auth-Card ---------------- */}
      <main className="flex items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size={32} />
          </div>

          <div className="rounded-2xl border border-line bg-surface p-7 shadow-card sm:p-8">
            <div className="mb-6">
              <h2 className="text-[22px] font-semibold tracking-tight text-ink">
                {isLogin ? 'Willkommen zurück' : 'Konto erstellen'}
              </h2>
              <p className="mt-1.5 text-[14px] text-muted">
                {isLogin
                  ? 'Melde dich an, um auf dein Workspace zuzugreifen.'
                  : 'Starte in wenigen Sekunden mit MeetingMind.'}
              </p>
            </div>

            {/* Tabs – Milchglas-Segmented-Control */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-line/70 bg-white/55 p-1 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              {[
                { label: 'Anmelden', active: isLogin, onClick: () => switchMode(true) },
                { label: 'Registrieren', active: !isLogin, onClick: () => switchMode(false) },
              ].map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={tab.onClick}
                  aria-pressed={tab.active}
                  className={`rounded-lg py-2 text-[14px] font-medium transition ${
                    tab.active
                      ? 'bg-navy text-white shadow-soft'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-ink">
                    Vollständiger Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Max Mustermann"
                    required={!isLogin}
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink">
                  E-Mail-Adresse
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="du@unternehmen.de"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-[13px] font-medium text-ink">
                    Passwort
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      className="text-[13px] font-medium text-brand transition hover:text-brand-600"
                    >
                      Passwort vergessen?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-navy px-4 py-3 text-[15px] font-semibold text-white shadow-soft transition hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/20 active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Bitte warten…' : isLogin ? 'Anmelden' : 'Konto erstellen'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[13px] text-muted">
            {isLogin ? 'Noch kein Konto? ' : 'Bereits registriert? '}
            <button
              type="button"
              onClick={() => switchMode(!isLogin)}
              className="font-semibold text-brand transition hover:text-brand-600"
            >
              {isLogin ? 'Jetzt registrieren' : 'Anmelden'}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
