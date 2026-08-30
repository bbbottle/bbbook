import { cn } from '../utils/cn.js'

export interface WifiIconProps {
  size?: number
  className?: string
}

export function WifiIcon({ size = 24, className }: WifiIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="42"
      strokeLinecap="square"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M332.69 320a115 115 0 00-152.8 0M393.74 259a201.26 201.26 0 00-274.92 0M448 191.52a288 288 0 00-383.44 0" fill="none" />
      <path d="M300.67 384L256 433l-44.34-49a56.73 56.73 0 0188.92 0z" />
    </svg>
  )
}
