import { type ReactNode } from 'react'
import { cn } from '../../utils/cn.js'
import { Icon } from '../Icon/index.js'

export interface ActionBarProps {
  children?: ReactNode
  className?: string
}

export function ActionBar({ children, className }: ActionBarProps) {
  return (
    <div
      className={cn(
        'flex h-[54px] items-center bg-paper px-1',
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
  return <div className={cn('flex h-full min-w-0 items-center', className)}>{children}</div>
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
        'flex h-[50px] w-[50px] flex-col items-center justify-center',
        'text-[10px] font-sans font-medium lowercase tracking-wide text-ink',
        'transition-[colors,transform] duration-ku-fast ease-ku-out focus-visible:ku-focus-ring active:scale-[0.97] active:bg-ink active:text-paper',
        className
      )}
    >
      {icon ? (
        <span className="flex h-[22px] w-[22px] items-center justify-center">{icon}</span>
      ) : null}
      {children ? <span className="leading-none">{children}</span> : null}
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
    <div
      className={cn(
        'relative flex h-full w-full min-w-0 max-w-[150px] items-center justify-center border-x border-divider',
        className
      )}
    >
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink">
        <Icon name="search" size={18} />
      </span>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.(e.currentTarget.value)}
        className={cn(
          'h-full w-full bg-transparent px-2 text-center text-sm font-sans text-ink placeholder:text-subtle',
          'focus-visible:ku-focus-ring'
        )}
      />
    </div>
  )
}

export interface ActionBarSpaceProps {
  className?: string
}

export function ActionBarSpace({ className }: ActionBarSpaceProps) {
  return <div className={cn('min-w-0 flex-1 px-2', className)} />
}
