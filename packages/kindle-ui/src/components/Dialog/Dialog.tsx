import { type ReactNode, useEffect, useRef, useState } from 'react'
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
  const [mounted, setMounted] = useState(open)
  const [entering, setEntering] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setMounted(true)
      const raf = requestAnimationFrame(() => setEntering(true))
      return () => cancelAnimationFrame(raf)
    }
    setEntering(false)
    const timer = setTimeout(() => setMounted(false), 200)
    return () => clearTimeout(timer)
  }, [open])

  if (!mounted) return null

  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex items-center justify-center bg-black/20 p-4',
        open ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full max-w-sm rounded-dialog border border-ink bg-paper p-6',
          'transition-[opacity,transform] duration-ku-base ease-ku-out origin-center',
          entering ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
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
            className="absolute right-4 top-4 text-muted transition-colors duration-ku-fast ease-ku-out hover:text-ink focus-visible:ku-focus-ring"
            aria-label="Close"
          >
            <Icon name="close" size={24} />
          </button>
        )}
      </div>
    </div>
  )
}
