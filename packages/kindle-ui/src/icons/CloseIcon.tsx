import { cn } from '../utils/cn.js'

export interface CloseIconProps {
  size?: number
  className?: string
}

export function CloseIcon({ size = 24, className }: CloseIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z" />
    </svg>
  )
}
