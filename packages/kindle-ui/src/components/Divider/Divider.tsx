import { cn } from '../../utils/cn.js'

export interface DividerProps {
  className?: string
}

export function Divider({ className }: DividerProps) {
  return <hr className={cn('border-t border-divider', className)} />
}
