import { cn } from '../utils/cn.js'

export interface CellularIconProps {
  size?: number
  className?: string
}

export function CellularIcon({ size = 20, className }: CellularIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M496 432h-96V80h96zM368 432h-96V160h96zM240 432h-96V224h96zM112 432H16V288h96z" />
    </svg>
  )
}
