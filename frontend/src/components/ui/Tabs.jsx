/**
 * Tabs – Milchglas-Segmented-Control.
 * tabs: [{ key, label }]; value/onChange steuern den aktiven Tab.
 */
export default function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={`inline-flex gap-1 rounded-button border border-white/70 bg-white/55 p-1 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-white/5 ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.key === value
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={`rounded-[10px] px-4 py-1.5 text-[13px] font-semibold transition ${
              active ? 'bg-navy text-white shadow-soft' : 'text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
