/** EmptyState – ruhiger Leerzustand mit Icon, Text und optionaler Aktion. */
export default function EmptyState({ icon: IconCmp, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {IconCmp && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-muted">
          <IconCmp size={22} />
        </span>
      )}
      <h3 className="mt-4 text-[15px] font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
