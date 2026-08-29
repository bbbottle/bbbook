import { type MouseEventHandler, type ReactNode } from 'react'
import { cn } from '../../utils/cn.js'

export interface ListItemIconProps {
  children?: ReactNode
  className?: string
  onClick?: MouseEventHandler<HTMLDivElement>
}

export function ListItemIcon({ children, className, onClick }: ListItemIconProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center justify-center text-ink',
        'active:opacity-70',
        className
      )}
    >
      {children}
    </div>
  )
}
