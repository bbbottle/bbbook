import { cn } from '../../utils/cn.js'

export type IndicatorLightStatus = 'on' | 'off' | 'blink'

export interface IndicatorLightProps {
  className?: string
  danger?: boolean
  status?: IndicatorLightStatus
}

export function IndicatorLight({
  className,
  danger = false,
  status = 'off',
}: IndicatorLightProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('ku-indicator-light', className)}
      data-danger={danger ? 'true' : undefined}
      data-status={status}
    />
  )
}
