interface IconProps {
  className?: string;
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a4 4 0 0 0-8 0M11 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7 6a3.5 3.5 0 0 0-3-3.46M15.5 12a3 3 0 1 0 0-6" />
    </svg>
  );
}

export function VoteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6Zm0 0 8 6 8-6M9 15l2 2 4-4" />
    </svg>
  );
}

export function WalletIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1h1.5A1.5 1.5 0 0 1 21 10.5v6a1.5 1.5 0 0 1-1.5 1.5H5a2 2 0 0 1-2-2V8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 13.5h2" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path strokeLinecap="round" d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

export function SplitIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <path d="M12 3v18M12 3a9 9 0 0 1 9 9h-9V3ZM12 12H3a9 9 0 0 0 9 9v-9Z" strokeLinejoin="round" />
    </svg>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.5l2.9 6.2 6.6.6-5 4.6 1.5 6.6-6-3.5-6 3.5 1.5-6.6-5-4.6 6.6-.6L12 2.5Z" />
    </svg>
  );
}

export function LeafIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinejoin="round" d="M4 20Q4 4 20 4Q20 20 4 20Z" />
      <path strokeLinecap="round" d="M5 19Q12 12 19 5" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m0 0-6-6m6 6-6 6" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5 12 4l8 7.5M6 9.5V20h12V9.5" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function ListIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <path strokeLinecap="round" d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

export function PieChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <path d="M12 3v9h9a9 9 0 1 1-9-9Z" strokeLinejoin="round" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" d="M19.4 13a7.97 7.97 0 0 0 0-2l2-1.3-2-3.4-2.3.8a8 8 0 0 0-1.7-1L15 3h-6l-.4 2.1a8 8 0 0 0-1.7 1l-2.3-.8-2 3.4L4.6 11a7.97 7.97 0 0 0 0 2l-2 1.3 2 3.4 2.3-.8a8 8 0 0 0 1.7 1L9 21h6l.4-2.1a8 8 0 0 0 1.7-1l2.3.8 2-3.4-2-1.3Z" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <circle cx="6" cy="12" r="2.25" />
      <circle cx="17.5" cy="6" r="2.25" />
      <circle cx="17.5" cy="18" r="2.25" />
      <path strokeLinecap="round" d="m8 10.8 7.7-4.3M8 13.2l7.7 4.3" />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.5 19.5 7.5 8 19H5v-3L16.5 4.5Z" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}
