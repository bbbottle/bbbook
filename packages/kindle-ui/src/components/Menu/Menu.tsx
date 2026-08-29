import { useMemo, type ReactNode, type ElementType, type MouseEventHandler } from 'react'
import { Popover } from '../Popover/index.js'
import { cn } from '../../utils/cn.js'

export interface MenuProps {
  anchorEl?: Element | null | ((element: Element) => Element)
  open?: boolean
  onClose?: () => void
  children?: ReactNode
  className?: string
}

const MENU_WIDTH = 230

export function Menu({ anchorEl, open, onClose, children, className }: MenuProps) {
  const position = useMemo(() => {
    if (!anchorEl) return { top: 0, left: 0 }
    const el = typeof anchorEl === 'function' ? anchorEl(document.body) : anchorEl
    const rect = el.getBoundingClientRect()
    return {
      top: rect.bottom + 2,
      left: Math.max(8, rect.right - MENU_WIDTH),
    }
  }, [anchorEl])

  return (
    <Popover open={open} onClose={onClose}>
      <div
        className={cn(
          'fixed z-50 min-w-[230px] overflow-hidden rounded-dialog border border-ink bg-paper shadow-eink',
          className
        )}
        style={{ top: position.top, left: position.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </Popover>
  )
}

export interface MenuItemProps {
  textPrimary?: string
  href?: string
  component?: ElementType
  className?: string
  onClick?: MouseEventHandler<HTMLElement>
}

export function MenuItem({
  textPrimary,
  href,
  component,
  className,
  onClick,
}: MenuItemProps) {
  const Component = component || (href ? 'a' : 'div')
  return (
    <Component
      href={Component === 'a' ? href : undefined}
      onClick={onClick}
      className={cn(
        'block cursor-pointer px-5 py-3 text-base font-sans text-ink outline-none',
        'hover:bg-ink hover:text-surface active:bg-ink active:text-paper focus-visible:ku-focus-ring',
        className
      )}
    >
      {textPrimary}
    </Component>
  )
}
