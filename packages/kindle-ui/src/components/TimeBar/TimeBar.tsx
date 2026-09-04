import { useMinuteTime } from '../../hooks/useMinuteTime.js'
import { cn } from '../../utils/cn.js'

export interface TimeBarProps {
  className?: string
}

export function TimeBar({ className }: TimeBarProps) {
  const time = useMinuteTime()

  return (
    <div
      className={cn(
        'flex h-5 items-center justify-center bg-paper text-xs font-sans text-muted',
        className
      )}
    >
      {time}
    </div>
  )
}
