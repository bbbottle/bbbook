import { cn } from '../utils/cn.js'

export interface CellularIconProps {
  size?: number
  signal?: number
  className?: string
}

export function CellularIcon({ size = 20, signal, className }: CellularIconProps) {
  const bars = signal === undefined ? 4 : Math.min(Math.max(Math.ceil((signal / 5) * 4), 1), 4)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      {bars >= 1 && <rect x="16" y="288" width="96" height="144" />}
      {bars >= 2 && <rect x="144" y="224" width="96" height="208" />}
      {bars >= 3 && <rect x="272" y="160" width="96" height="272" />}
      {bars >= 4 && <rect x="400" y="80" width="96" height="352" />}
    </svg>
  )
}
