import { type ElementType, type ReactNode, forwardRef } from 'react'
import { cn } from '../../utils/cn.js'

export interface ListItemProps {
  as?: ElementType
  title?: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  selected?: boolean
  active?: boolean
  children?: ReactNode
  className?: string
  href?: string
  onClick?: React.MouseEventHandler<HTMLElement>
}

export const ListItem = forwardRef<HTMLElement, ListItemProps>(function ListItem(
  {
    as,
    title,
    subtitle,
    meta,
    selected,
    active,
    children,
    className,
    href,
    onClick,
    ...rest
  },
  ref
) {
  const Component = as || (href ? 'a' : 'div')

  return (
    <Component
      ref={ref as never}
      href={Component === 'a' ? href : undefined}
      onClick={onClick}
      className={cn(
        'group relative flex items-center justify-between gap-4 px-4 py-3 min-h-[56px] cursor-pointer border-b border-divider last:border-b-0 text-left',
        'outline-none focus-visible:ku-focus-ring active:bg-ink active:text-surface',
        (selected || active) && 'bg-ink text-surface',
        className
      )}
      {...rest}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-base leading-snug font-sans truncate">{title}</div>
        )}
        {subtitle && (
          <div className="text-sm leading-snug font-sans text-muted truncate group-[.active]:text-surface/80">
            {subtitle}
          </div>
        )}
        {children}
      </div>
      {meta && (
        <div className="shrink-0 text-sm text-muted group-[.active]:text-surface/80">
          {meta}
        </div>
      )}
    </Component>
  )
})
