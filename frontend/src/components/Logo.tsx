interface LogoProps {
  size?: number
  className?: string
}

export function LogoIcon({ size = 32, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <defs>
        <linearGradient id="shipproof-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#8B5CF6"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#shipproof-bg)"/>
      <rect x="15" y="13" width="34" height="25" rx="7" fill="white"/>
      <path d="M24,38 L20,47 L31,38Z" fill="white"/>
      <path d="M23,24 L29,31 L41,18" fill="none" stroke="#6366F1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function LogoFull({ size = 32, className }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className || ''}`}>
      <LogoIcon size={size} />
      <span
        className="font-semibold tracking-tight"
        style={{ fontSize: size * 0.55, color: '#F1F1F3', letterSpacing: '-0.3px' }}
      >
        Ship<span style={{ color: '#818CF8' }}>Proof</span>
      </span>
    </div>
  )
}
