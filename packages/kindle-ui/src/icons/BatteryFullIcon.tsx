import { cn } from '../utils/cn.js'

export interface BatteryFullIconProps {
  size?: number
  className?: string
}

export function BatteryFullIcon({ size = 22, className }: BatteryFullIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M17 384h432V128H17zm32-224h368v192H49z" />
      <path d="M70.69 182.94h324.63v146.13H70.69zM465 202.67h32v106.67h-32z" />
    </svg>
  )
}
