/**
 * DataCard – hochwertige Karten-Hülle mit optionalem Header (Titel + Aktion).
 * `noPadding` für Listen, die bis an den Rand gehen.
 */
export default function DataCard({ title, action, icon: IconCmp, noPadding = false, className = '', children }) {
  return (
    <section className={`rounded-card border border-line bg-surface shadow-soft ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-2">
            {IconCmp && <IconCmp size={18} className="text-muted" />}
            <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </section>
  )
}
