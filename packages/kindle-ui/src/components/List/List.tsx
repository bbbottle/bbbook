import { type ReactNode } from 'react'
import { cn } from '../../utils/cn.js'

export interface ListProps {
  children?: ReactNode
  className?: string
}

export function List({ children, className }: ListProps) {
  return <div className={cn('flex flex-col', className)} role="list">{children}</div>
}
