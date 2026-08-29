import { type ReactNode, useEffect, useRef } from 'react'
import { cn } from '../../utils/cn.js'
import { Icon } from '../Icon/index.js'

export interface DialogProps {
  open?: boolean
  onClose?: () => void
  title?: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, children, actions, className }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null)

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full max-w-sm rounded-dialog border-3 border-ink bg-surface p-6',
          className
        )}
      >
        {title && <h2 className="mb-4 text-lg font-serif font-semibold text-ink">{title}</h2>}
        <div className="text-base font-serif text-ink">{children}</div>
        {actions && <div className="mt-6 flex items-center justify-end gap-3">{actions}</div>}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-muted hover:text-ink focus-visible:ku-focus-ring"
            aria-label="Close"
          >
            <Icon name="close" size={24} />
          </button>
        )}
      </div>
    </div>
  )
}
