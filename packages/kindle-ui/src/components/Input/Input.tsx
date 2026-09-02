import { useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { cn } from '../../utils/cn.js'

export interface InputProps {
  id?: string
  name?: string
  type?: 'text' | 'password' | 'email' | 'number' | 'search'
  value?: string
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  autoFocus?: boolean
  className?: string
  onChange?: (value: string) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

const inputBase =
  'h-12 w-full rounded-md border border-divider bg-paper px-3 font-sans text-base text-ink placeholder:text-subtle transition-colors focus-visible:ku-focus-ring disabled:opacity-50 disabled:cursor-not-allowed'

export function Input({
  type = 'text',
  value,
  defaultValue,
  onChange,
  className,
  ...rest
}: InputProps) {
  const isControlled = value !== undefined
  return (
    <input
      type={type}
      value={isControlled ? value : undefined}
      defaultValue={isControlled ? undefined : defaultValue}
      className={cn(inputBase, className)}
      onChange={(e) => onChange?.(e.currentTarget.value)}
      {...rest}
    />
  )
}

export interface OtpInputProps {
  value?: string
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  className?: string
  ariaLabel?: string
  getDigitAriaLabel?: (index: number, length: number) => string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
}

const OTP_LENGTH = 6

function toDigits(value: string, length: number) {
  return value.replace(/\D/g, '').slice(0, length).split('')
}

export function OtpInput({
  value = '',
  length = OTP_LENGTH,
  disabled,
  autoFocus,
  className,
  ariaLabel,
  getDigitAriaLabel,
  onChange,
  onComplete,
}: OtpInputProps) {
  const digits = toDigits(value, length)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const rawValue = digits.join('')

  const update = (next: string) => {
    const cleaned = next.replace(/\D/g, '').slice(0, length)
    onChange?.(cleaned)
    if (cleaned.length === length) {
      onComplete?.(cleaned)
    }
  }

  const focus = (index: number) => {
    const el = refs.current[index]
    if (el) {
      el.focus()
      el.setSelectionRange(0, el.value.length)
    }
  }

  const replaceAt = (index: number, char: string) => {
    const head = rawValue.slice(0, index)
    const tail = rawValue.slice(index + 1)
    return (head + char + tail).slice(0, length)
  }

  const removeAt = (index: number) => {
    return rawValue.slice(0, index) + rawValue.slice(index + 1)
  }

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.currentTarget.value.replace(/\D/g, '').slice(0, length)
    if (!text) return
    const next = (rawValue.slice(0, index) + text + rawValue.slice(index + text.length)).slice(0, length)
    update(next)
    const filled = index + text.length
    if (filled < length) {
      focus(filled)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    const current = digits[index] || ''

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (current) {
        update(removeAt(index))
      } else if (index > 0) {
        update(removeAt(index - 1))
        focus(index - 1)
      }
      return
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focus(index - 1)
      return
    }

    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      focus(index + 1)
      return
    }

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault()
      const next = replaceAt(index, e.key)
      update(next)
      if (next.length < length) {
        focus(index + 1)
      }
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    update(text)
  }

  return (
    <div
      className={cn('flex w-full items-center justify-between gap-2', className)}
      role="group"
      aria-label={ariaLabel}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          value={digits[i] || ''}
          aria-label={getDigitAriaLabel ? getDigitAriaLabel(i, length) : undefined}
          className={cn(
            'h-12 flex-1 min-w-0 rounded-md border border-divider bg-paper text-center font-sans text-base text-ink transition-colors focus-visible:ku-focus-ring disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.setSelectionRange(0, e.currentTarget.value.length)}
        />
      ))}
    </div>
  )
}
