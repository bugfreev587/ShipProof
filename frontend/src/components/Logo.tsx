interface LogoProps {
  size?: number
  className?: string
}

export function LogoIcon({ size = 32, className }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <circle cx="32" cy="32" r="28" fill="#6366F1"/>
      <path d="M32,46 C32,46 16,35 16,26 C16,20 19,17 24,17 C27,17 30,19 32,21 C34,19 37,17 40,17 C45,17 48,20 48,26 C48,35 32,46 32,46Z" fill="white"/>
    </svg>
  )
}

export function LogoFull({ size = 32, className }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className || ''}`}>
      <LogoIcon size={size} />
      <span
        className="font-semibold tracking-tight text-foreground"
        style={{ fontSize: size * 0.55, letterSpacing: '-0.3px' }}
      >
        Ship<span style={{ color: '#818CF8' }}>Proof</span>
      </span>
    </div>
  )
}
