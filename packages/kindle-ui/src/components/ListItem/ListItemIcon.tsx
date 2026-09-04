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
        'flex shrink-0 items-center justify-center text-ink group-active:text-surface group-[.active]:text-surface',
        'transition-transform duration-ku-fast ease-ku-out active:scale-[0.95]',
        className
      )}
    >
      {children}
    </div>
  )
}
