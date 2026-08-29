import { type ReactNode, type MouseEventHandler } from 'react'
import { cn } from '../../utils/cn.js'

export interface TabProps {
  children?: ReactNode
  className?: string
}

export function Tab({ children, className }: TabProps) {
  return (
    <div className={cn('flex items-center overflow-x-auto px-1 py-2', className)}>
      {children}
    </div>
  )
}

export interface TabItemProps {
  active?: boolean
  children?: ReactNode
  className?: string
  onClick?: MouseEventHandler<HTMLDivElement>
}

export function TabItem({ active, children, className, onClick }: TabItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer whitespace-nowrap border-r border-divider px-3 py-1 text-sm font-sans uppercase text-muted last:border-r-0',
        'hover:text-ink active:text-ink',
        active && 'font-semibold text-ink',
        className
      )}
    >
      {children}
    </div>
  )
}
