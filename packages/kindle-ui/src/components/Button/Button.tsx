import { type ElementType, type ReactNode, forwardRef } from 'react'
import { cn } from '../../utils/cn.js'

export interface ButtonProps {
  as?: ElementType
  variant?: 'default' | 'outline' | 'ghost'
  disabled?: boolean
  children?: ReactNode
  className?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: React.MouseEventHandler<HTMLElement>
}

export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    as,
    variant = 'default',
    disabled,
    children,
    className,
    href,
    type = 'button',
    onClick,
    ...rest
  },
  ref
) {
  const Component = as || (href ? 'a' : 'button')
  const isDisabled = disabled

  const baseStyles =
    'inline-flex items-center justify-center min-w-[70px] h-12 px-6 rounded-md font-sans text-sm font-semibold tracking-wide uppercase transition-[colors,transform] duration-ku-fast ease-ku-out focus-visible:ku-focus-ring active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    default: 'bg-ink text-paper hover:bg-paper hover:text-ink border border-ink active:bg-ink active:text-paper',
    outline: 'bg-paper text-ink border border-ink hover:bg-ink hover:text-paper active:bg-ink active:text-paper',
    ghost: 'bg-transparent text-ink border-0 hover:underline underline-offset-4',
  }

  return (
    <Component
      ref={ref as never}
      href={Component === 'a' ? href : undefined}
      type={Component === 'button' ? type : undefined}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...rest}
    >
      {children}
    </Component>
  )
})
