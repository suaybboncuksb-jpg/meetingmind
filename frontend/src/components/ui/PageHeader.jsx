/** PageHeader – einheitlicher Premium-Seitenkopf: Titel, Untertitel, optionale Aktionen rechts. */
export default function PageHeader({ title, subtitle, actions, badge = 'MeetingMind Workspace' }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-line/80 bg-surface/82 px-5 py-5 shadow-soft backdrop-blur-xl sm:px-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-brand/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center rounded-full border border-line bg-canvas/80 px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            {badge}
          </div>
          <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-ink sm:text-[32px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}