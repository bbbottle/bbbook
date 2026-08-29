import { type ReactNode } from 'react'
import { cn } from '../../utils/cn.js'

export interface NavbarProps {
  children?: ReactNode
  className?: string
  fixed?: boolean
}

export function Navbar({ children, className, fixed = false }: NavbarProps) {
  return (
    <nav
      className={cn(
        'w-full border-b border-divider bg-paper',
        fixed && 'sticky top-0 z-30',
        className
      )}
    >
      {children}
    </nav>
  )
}
