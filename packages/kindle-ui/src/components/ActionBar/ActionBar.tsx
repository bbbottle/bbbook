import { type ReactNode } from 'react'
import { cn } from '../../utils/cn.js'

export interface ActionBarProps {
  children?: ReactNode
  className?: string
}

export function ActionBar({ children, className }: ActionBarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-divider px-2 py-2',
        className
      )}
    >
      {children}
    </div>
  )
}

export interface ActionGroupProps {
  children?: ReactNode
  className?: string
}

export function ActionGroup({ children, className }: ActionGroupProps) {
  return <div className={cn('flex items-center', className)}>{children}</div>
}

export interface ActionItemProps {
  icon?: ReactNode
  children?: ReactNode
  className?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function ActionItem({ icon, children, className, onClick }: ActionItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center px-3 py-1 text-[10px] font-sans font-medium uppercase tracking-wide text-ink',
        'focus-visible:ku-focus-ring active:opacity-70',
        className
      )}
    >
      {icon && <span className="mb-0.5">{icon}</span>}
      {children}
    </button>
  )
}


export interface SearchBarProps {
  value?: string
  placeholder?: string
  className?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
}

export function SearchBar({
  value,
  placeholder = 'Search',
  className,
  onChange,
  onSubmit,
}: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.(e.currentTarget.value)}
        className={cn(
          'h-8 w-full rounded-screen border border-ink bg-surface pl-2 pr-6 text-xs font-sans text-ink placeholder:text-subtle',
          'focus-visible:ku-focus-ring'
        )}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </span>
    </div>
  )
}

export interface ActionBarSpaceProps {
  className?: string
}

export function ActionBarSpace({ className }: ActionBarSpaceProps) {
  return <div className={cn('flex-[2_4_auto] px-2', className)} />
}
