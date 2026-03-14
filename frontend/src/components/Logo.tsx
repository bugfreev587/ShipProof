interface LogoProps {
  size?: number
  className?: string
}

export function LogoIcon({ size = 32, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="#6366F1"/>
      <rect x="14" y="11" width="36" height="26" rx="7" fill="white"/>
      <path d="M22,37 L18,48 L30,37Z" fill="white"/>
      <path d="M22,22 L28,30 L42,15" fill="none" stroke="#6366F1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
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
