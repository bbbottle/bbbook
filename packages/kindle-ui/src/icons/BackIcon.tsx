import { cn } from '../utils/cn.js'

export interface BackIconProps {
  size?: number
  className?: string
}

export function BackIcon({ size = 24, className }: BackIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="48"
      strokeLinecap="square"
      strokeMiterlimit="10"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M244 400L100 256l144-144M120 256h292" />
    </svg>
  )
}
