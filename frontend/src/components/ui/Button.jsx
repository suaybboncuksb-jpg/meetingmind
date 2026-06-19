/**
 * Button – zentrale Schaltfläche mit klaren Varianten.
 *   primary   – Navy, starke CTA
 *   secondary – Weiß mit Border
 *   glass     – Milchglas (halbtransparent + Blur)
 *   ghost     – minimal, nur Text
 */
const VARIANTS = {
  primary:
    'bg-navy text-white shadow-soft hover:bg-navy-700 focus-visible:ring-navy/20',
  secondary:
    'border border-line bg-surface text-ink shadow-soft hover:bg-soft focus-visible:ring-navy/15',
  glass:
    'border border-white/70 bg-white/60 text-ink shadow-soft backdrop-blur-md hover:bg-white/80 focus-visible:ring-navy/15 ' +
    'dark:border-white/10 dark:bg-white/10 dark:text-ink dark:hover:bg-white/15',
  ghost:
    'text-muted hover:bg-soft hover:text-ink focus-visible:ring-navy/15',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-[13px] gap-1.5',
  md: 'px-4 py-2.5 text-[14px] gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: IconCmp,
  iconRight: IconRight,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-button font-semibold transition
        focus-visible:outline-none focus-visible:ring-4 active:scale-[0.99]
        disabled:cursor-not-allowed disabled:opacity-60
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {IconCmp && <IconCmp size={size === 'sm' ? 16 : 18} />}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 16 : 18} />}
    </button>
  )
}
