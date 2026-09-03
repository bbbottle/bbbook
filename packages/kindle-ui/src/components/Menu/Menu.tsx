import {
  useLayoutEffect,
  useState,
  type ReactNode,
  type ElementType,
  type MouseEventHandler,
} from 'react'
import { Popover, usePopoverContainer, usePopoverEntering } from '../Popover/index.js'
import { cn } from '../../utils/cn.js'

export interface MenuProps {
  anchorEl?: Element | null | ((element: Element) => Element)
  open?: boolean
  onClose?: () => void
  children?: ReactNode
  className?: string
}

const MENU_WIDTH = 230

export function Menu({
  anchorEl,
  open,
  onClose,
  children,
  className,
}: MenuProps) {
  return (
    <Popover open={open} onClose={onClose}>
      <MenuContent
        anchorEl={anchorEl}
        className={className}
        onClose={onClose}
      >
        {children}
      </MenuContent>
    </Popover>
  )
}

interface MenuContentProps {
  anchorEl?: Element | null | ((element: Element) => Element)
  children?: ReactNode
  className?: string
  onClose?: () => void
}

function MenuContent({
  anchorEl,
  children,
  className,
}: MenuContentProps) {
  const container = usePopoverContainer()
  const entering = usePopoverEntering()
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!container || !anchorEl) return
    const el = typeof anchorEl === 'function' ? anchorEl(document.body) : anchorEl
    if (!el) return
    const rect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    setPosition({
      top: rect.bottom - containerRect.top + 2,
      left: Math.max(8, rect.right - containerRect.left - MENU_WIDTH),
    })
  }, [anchorEl, container])

  if (!container || position === null) return null

  return (
    <div
      className={cn(
        'absolute z-30 min-w-[230px] overflow-hidden rounded-dialog border border-ink bg-paper shadow-eink',
        'transition-[opacity,transform] duration-ku-base ease-ku-out origin-top-right',
        entering ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
      style={{ ...position, transformOrigin: 'right top' }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
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
        'transition-colors duration-ku-fast ease-ku-out hover:bg-ink hover:text-surface active:scale-[0.99] active:bg-ink active:text-paper focus-visible:ku-focus-ring',
        className
      )}
    >
      {textPrimary}
    </Component>
  )
}
