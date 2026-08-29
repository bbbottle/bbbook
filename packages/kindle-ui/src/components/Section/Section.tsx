import { type ReactNode } from 'react'
import { cn } from '../../utils/cn.js'

export interface SectionProps {
  children?: ReactNode
  className?: string
}

export function Section({ children, className }: SectionProps) {
  return <section className={cn('px-4 py-2', className)}>{children}</section>
}

export interface SectionTitleProps {
  label?: string
  className?: string
  onClick?: () => void
}

export function SectionTitle({ label, className, onClick }: SectionTitleProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-2 py-2 text-base font-sans font-semibold text-ink',
        className
      )}
    >
      <span className="uppercase tracking-wide">{label}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="18"
        viewBox="0 0 24 24"
        width="18"
        fill="currentColor"
      >
        <path d="M9.29 6.71a.996.996 0 0 0 0 1.41L13.17 12l-3.88 3.88a.996.996 0 1 0 1.41 1.41l4.59-4.59a.996.996 0 0 0 0-1.41L10.7 6.71a.996.996 0 0 0-1.41 0z" />
      </svg>
    </div>
  )
}
