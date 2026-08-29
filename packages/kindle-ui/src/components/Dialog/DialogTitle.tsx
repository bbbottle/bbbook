import { type ReactNode } from 'react'
import { cn } from '../../utils/cn.js'

export interface DialogTitleProps {
  children?: ReactNode
  className?: string
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-sans font-semibold text-ink', className)}>
      {children}
    </h2>
  )
}
