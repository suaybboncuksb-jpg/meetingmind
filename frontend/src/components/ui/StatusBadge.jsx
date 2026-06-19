/**
 * StatusBadge – einheitliche Status-Pille für Meetings & Aufgaben.
 */
const STATUS = {
  // Meetings
  ANALYZED: { label: 'Analysiert', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  ANALYZING: { label: 'Wird analysiert', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  DRAFT: { label: 'Entwurf', className: 'border-line bg-soft text-muted' },
  // Aufgaben
  OPEN: { label: 'Offen', className: 'border-line bg-soft text-muted' },
  IN_PROGRESS: { label: 'In Arbeit', className: 'border-blue-200 bg-blue-50 text-brand' },
  DONE: { label: 'Erledigt', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
}

export default function StatusBadge({ status }) {
  const meta = STATUS[status] || STATUS.DRAFT
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.className}`}>
      {meta.label}
    </span>
  )
}
