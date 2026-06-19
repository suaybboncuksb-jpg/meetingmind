/**
 * MeetingMind Logo
 * -----------------------------------------------------------------------------
 * SVG-Nachbau des Marken-Logos: Sprechblasen-/M-Mark im Blau→Navy-Verlauf
 * + Sparkle + Wordmark „MeetingMind". Skaliert verlustfrei, keine Asset-Datei nötig.
 *
 * Props:
 *   onDark   – true auf dunklem (Navy-)Hintergrund -> Mark & Wordmark in Weiß.
 *   size     – Höhe der Mark in px (Wordmark skaliert mit).
 *   showWord – Wordmark ein-/ausblenden.
 *
 * Echtes PNG bevorzugt? Lege es als public/meetingmind-logo.png ab und ersetze
 * den <svg>-Mark-Block durch <img src="/meetingmind-logo.png" ... />.
 */

let gradientSeq = 0

function Mark({ onDark, size }) {
  // eindeutige Gradient-IDs, falls das Logo mehrfach auf einer Seite steht
  const gid = `mm-grad-${gradientSeq++}`
  const sid = `mm-spark-${gid}`
  const stroke = onDark ? '#ffffff' : `url(#${gid})`
  const sparkle = onDark ? '#cfe0ff' : `url(#${sid})`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gid} x1="10" y1="6" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5B6CF0" />
          <stop offset="0.55" stopColor="#2B49B0" />
          <stop offset="1" stopColor="#0D2137" />
        </linearGradient>
        <linearGradient id={sid} x1="36" y1="5" x2="44" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8AA0FF" />
          <stop offset="1" stopColor="#3D5BD0" />
        </linearGradient>
      </defs>

      {/* Sprechblase mit Tail unten-links */}
      <path
        d="M14 7h20a8 8 0 0 1 8 8v13a8 8 0 0 1-8 8H22l-6.2 6.2a1 1 0 0 1-1.7-.7V44a8 8 0 0 1-8-8V15a8 8 0 0 1 8-8Z"
        stroke={stroke}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* "M" im Inneren */}
      <path
        d="M16 31V18l8 7 8-7v13"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sparkle oben-rechts */}
      <path
        d="M39.5 5.5c.5 2.2 1.3 3 3.5 3.5-2.2.5-3 1.3-3.5 3.5-.5-2.2-1.3-3-3.5-3.5 2.2-.5 3-1.3 3.5-3.5Z"
        fill={sparkle}
      />
    </svg>
  )
}

export default function Logo({ onDark = false, size = 32, showWord = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark onDark={onDark} size={size} />
      {showWord && (
        <span
          className={`font-semibold tracking-[-0.02em] ${onDark ? 'text-white' : 'text-ink'}`}
          style={{ fontSize: Math.round(size * 0.62) }}
        >
          MeetingMind
        </span>
      )}
    </span>
  )
}
