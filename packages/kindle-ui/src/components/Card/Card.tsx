import { type ReactNode, type MouseEventHandler } from 'react'
import { cn } from '../../utils/cn.js'

export interface CardProps {
  children?: ReactNode
  className?: string
  onClick?: MouseEventHandler<HTMLDivElement>
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-ink bg-surface p-3 shadow-eink',
        className
      )}
    >
      {children}
    </div>
  )
}

export interface CardContentProps {
  children?: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('flex flex-col gap-2 font-sans text-ink', className)}>
      {children}
    </div>
  )
}

export interface CardMediaProps {
  src?: string
  alt?: string
  className?: string
}

export function CardMedia({ src, alt = '', className }: CardMediaProps) {
  return (
    <div className={cn('overflow-hidden rounded-sm bg-paper', className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover grayscale"
        />
      ) : (
        <div className="h-32 w-full bg-paper" />
      )}
    </div>
  )
}

export interface CardTitleProps {
  children?: ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-sans font-semibold text-ink', className)}>
      {children}
    </h3>
  )
}

export interface CardActionProps {
  children?: ReactNode
  className?: string
}

export function CardAction({ children, className }: CardActionProps) {
  return (
    <div className={cn('flex flex-row-reverse items-center gap-3 pt-2', className)}>
      {children}
    </div>
  )
}
