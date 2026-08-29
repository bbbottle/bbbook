import { type ReactNode } from 'react'
import { cn } from '../../utils/cn.js'

export interface DialogContentProps {
  children?: ReactNode
  className?: string
}

export function DialogContent({ children, className }: DialogContentProps) {
  return <div className={cn('py-4 text-base font-sans text-ink', className)}>{children}</div>
}
