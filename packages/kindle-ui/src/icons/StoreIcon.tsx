import { cn } from '../utils/cn.js'

export interface StoreIconProps {
  size?: number
  className?: string
}

export function StoreIcon({ size = 24, className }: StoreIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M64 96h384v96a16 16 0 0 1-16 16H80a16 16 0 0 1-16-16V96Z" />
      <path d="M64 208h384v208a16 16 0 0 1-16 16H80a16 16 0 0 1-16-16V208Z" />
      <path d="M192 288h128v144H192z" />
      <path d="M112 240h80v64h-80z" />
      <path d="M320 240h80v64h-80z" />
    </svg>
  )
}
