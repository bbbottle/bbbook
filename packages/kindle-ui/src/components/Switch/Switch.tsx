import { type ChangeEventHandler, type InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn.js'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  checked?: boolean
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void
  ariaLabel?: string
  className?: string
}

export function Switch({
  checked,
  onChange,
  ariaLabel,
  className,
  disabled,
  ...rest
}: SwitchProps) {
  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange?.(e.target.checked, e)
  }

  return (
    <label
      className={cn(
        'relative inline-flex h-8 w-14 cursor-pointer items-center',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className="peer sr-only"
        {...rest}
      />
      <span className="h-full w-full rounded-full bg-muted transition-colors peer-checked:bg-ink peer-focus-visible:ku-focus-ring" />
      <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-paper transition-transform peer-checked:translate-x-6" />
    </label>
  )
}
