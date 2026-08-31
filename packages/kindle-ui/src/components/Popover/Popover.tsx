import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '../../utils/cn.js'

const PopoverContext = createContext<HTMLDivElement | null>(null)

export function usePopoverContainer() {
  return useContext(PopoverContext)
}

export interface PopoverProps {
  open?: boolean
  onClose?: () => void
  children?: ReactNode
  className?: string
}

export function Popover({ open, onClose, children, className }: PopoverProps) {
  if (!open) return null

  return <PopoverRoot onClose={onClose} className={className}>{children}</PopoverRoot>
}

function PopoverRoot({
  onClose,
  children,
  className,
}: {
  onClose?: () => void
  children?: ReactNode
  className?: string
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <PopoverContext.Provider value={container}>
      <div
        ref={setContainer}
        className={cn(
          'pointer-events-auto absolute inset-0 z-30',
          className
        )}
        onClick={onClose}
        aria-hidden="true"
      >
        {children}
      </div>
    </PopoverContext.Provider>
  )
}
