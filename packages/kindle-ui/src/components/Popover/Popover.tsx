import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '../../utils/cn.js'

interface PopoverContextValue {
  container: HTMLDivElement | null
  entering: boolean
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

export function usePopoverContainer() {
  return useContext(PopoverContext)?.container ?? null
}

export function usePopoverEntering() {
  return useContext(PopoverContext)?.entering ?? false
}

export interface PopoverProps {
  open?: boolean
  onClose?: () => void
  children?: ReactNode
  className?: string
}

export function Popover({ open = false, onClose, children, className }: PopoverProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(open)
  const [entering, setEntering] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

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
    <PopoverContext.Provider value={{ container, entering }}>
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
