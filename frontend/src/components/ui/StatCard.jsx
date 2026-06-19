/** StatCard – KPI-Kachel mit Icon-Chip, großem Wert und Label. */
export default function StatCard({ icon: IconCmp, label, value, accent = 'bg-navy/5 text-navy' }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        {IconCmp && <IconCmp size={20} />}
      </span>
      <p className="mt-4 text-[28px] font-semibold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-1.5 text-[13px] text-muted">{label}</p>
    </div>
  )
}
