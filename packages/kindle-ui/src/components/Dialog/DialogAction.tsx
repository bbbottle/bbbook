import { type ReactNode } from 'react'
import { cn } from '../../utils/cn.js'

export interface DialogActionProps {
  children?: ReactNode
  className?: string
}

export function DialogAction({ children, className }: DialogActionProps) {
  return <div className={cn('flex flex-row-reverse items-center gap-3', className)}>{children}</div>
}
