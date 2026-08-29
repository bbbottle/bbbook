import { type ReactNode } from 'react'
import { cn } from '../../utils/cn.js'

export interface NavbarProps {
  title?: ReactNode
  left?: ReactNode
  right?: ReactNode
  children?: ReactNode
  className?: string
  fixed?: boolean
}

export function Navbar({ title, left, right, children, className, fixed = false }: NavbarProps) {
  return (
    <nav
      className={cn(
        'relative z-20 border-b border-divider bg-surface',
        fixed && 'sticky top-0',
        className
      )}
    >
      <div className="flex h-12 items-center justify-between px-4">
        <div className="flex w-16 items-center justify-start">{left}</div>
        <div className="flex-1 truncate px-2 text-center font-sans text-base font-medium text-ink">
          {title}
        </div>
        <div className="flex w-16 items-center justify-end">{right}</div>
      </div>
      {children}
    </nav>
  )
}
