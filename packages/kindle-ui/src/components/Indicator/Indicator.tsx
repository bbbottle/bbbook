import type { CSSProperties } from 'react'
import { cn } from '../../utils/cn.js'

export interface IndicatorProps {
  status?: 'on' | 'off' | 'blink'
  className?: string
  style?: CSSProperties
}

export function Indicator({ status = 'off', className, style }: IndicatorProps) {
  return (
    <div
      className={cn(
        'rounded-full border border-transparent',
        'h-[clamp(4px,1.5cqw,12px)] w-[clamp(4px,1.5cqw,12px)]',
        status === 'on' && 'bg-indicator shadow-indicator',
        status === 'off' && 'bg-device-shell border-device-shell shadow-none',
        status === 'blink' && 'animate-blink bg-indicator shadow-indicator',
        className
      )}
      style={style}
      aria-label={`indicator ${status}`}
    />
  )
}
