/**
 * Schlanke Inline-SVG-Icons (Stroke = currentColor), damit keine zusätzliche
 * Icon-Library nötig ist. Größe via `size`-Prop.
 */
function Icon({ size = 20, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const PlusIcon = (p) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
)

export const CalendarIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </Icon>
)

export const SparklesIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
    <path d="M19 14l.7 1.8L21.5 16.5 19.7 17.2 19 19l-.7-1.8L16.5 16.5l1.8-.7L19 14Z" />
  </Icon>
)

export const CheckCircleIcon = (p) => (
  <Icon {...p}><path d="M21 12a9 9 0 1 1-3.6-7.2" /><path d="M9 12l2.5 2.5L22 5" /></Icon>
)

export const ClockIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></Icon>
)

export const ListIcon = (p) => (
  <Icon {...p}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></Icon>
)

export const FileTextIcon = (p) => (
  <Icon {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Icon>
)

export const ArrowRightIcon = (p) => (
  <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
)

export const XIcon = (p) => (
  <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>
)

export const HomeIcon = (p) => (
  <Icon {...p}><path d="M4 11l8-7 8 7" /><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" /><path d="M10 20v-6h4v6" /></Icon>
)

export const VideoIcon = (p) => (
  <Icon {...p}><rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="M16 10l5-3v10l-5-3" /></Icon>
)

export const CheckSquareIcon = (p) => (
  <Icon {...p}><path d="M9 11l2.5 2.5L16 8" /><rect x="3.5" y="3.5" width="17" height="17" rx="3.5" /></Icon>
)

export const SettingsIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></Icon>
)

export const UsersIcon = (p) => (
  <Icon {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-3-4.9" /></Icon>
)

export const FilterIcon = (p) => (
  <Icon {...p}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" /></Icon>
)

export const BellIcon = (p) => (
  <Icon {...p}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></Icon>
)

export const GlobeIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></Icon>
)

export const PlugIcon = (p) => (
  <Icon {...p}><path d="M9 3v6M15 3v6M6 9h12v3a6 6 0 0 1-12 0V9ZM12 18v3" /></Icon>
)

export const MenuIcon = (p) => (
  <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>
)

export const FlagIcon = (p) => (
  <Icon {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></Icon>
)

export const UserIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></Icon>
)
