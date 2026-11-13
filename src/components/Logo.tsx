// TRIGON mark (two facets) from graphics/trigon-logo-gradient.svg; `white` for dark panels.
export function LogoMark({ className, white }: { className?: string; white?: boolean }) {
  const fill = white ? '#fff' : 'url(#trigon-logo-g)'
  return (
    <svg viewBox="0 0 317 273" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="trigon-logo-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0a6fd8" />
          <stop offset="1" stopColor="#14c4c6" />
        </linearGradient>
      </defs>
      <path fill={fill} d="M157 0 L250 160 Q172 122 89 118 Z" />
      <path fill={fill} d="M89 123 L279 209 L317 272 L0 272 Z" />
    </svg>
  )
}
