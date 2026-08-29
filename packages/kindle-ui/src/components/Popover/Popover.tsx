import { type ReactNode, useEffect } from 'react'
import { cn } from '../../utils/cn.js'

export interface PopoverProps {
  open?: boolean
  onClose?: () => void
  children?: ReactNode
  className?: string
}

export function Popover({ open, onClose, children, className }: PopoverProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={cn('fixed inset-0 z-50', className)}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        className="h-full w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
