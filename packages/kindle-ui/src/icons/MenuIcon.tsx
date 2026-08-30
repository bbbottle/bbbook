import { cn } from '../utils/cn.js'

export interface MenuIconProps {
  size?: number
  className?: string
}

export function MenuIcon({ size = 24, className }: MenuIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <circle cx="256" cy="256" r="48" />
      <circle cx="256" cy="416" r="48" />
      <circle cx="256" cy="96" r="48" />
    </svg>
  )
}
