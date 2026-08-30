import { cn } from '../utils/cn.js'

export interface SearchIconProps {
  size?: number
  className?: string
}

export function SearchIcon({ size = 24, className }: SearchIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeMiterlimit="10"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M221.09 64a157.09 157.09 0 10157.09 157.09A157.1 157.1 0 00221.09 64z" />
      <path d="M338.29 338.29L448 448" />
    </svg>
  )
}
