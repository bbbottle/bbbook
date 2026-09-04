import { PaperAirplaneIcon } from '@primer/octicons-react/PaperAirplaneIcon'
import { RssIcon } from '@primer/octicons-react/RssIcon'
import { cn } from '../../utils/cn.js'
import { useMinuteTime } from '../../hooks/useMinuteTime.js'
import { BatteryChargingIcon } from '../../icons/BatteryChargingIcon.js'
import { BatteryFullIcon } from '../../icons/BatteryFullIcon.js'

export interface StatuBarProps {
  deviceName?: string
  time?: string
  battery?: number
  charging?: boolean
  airplane?: boolean
  celluar?: {
    on?: boolean
    label?: string
    signal?: number
  }
  className?: string
}

export function StatuBar({
  deviceName = 'My Kindle',
  time,
  battery,
  charging = false,
  airplane = false,
  celluar,
  className,
}: StatuBarProps) {
  const liveTime = useMinuteTime()
  const displayTime = time ?? liveTime

  return (
    <div
      className={cn(
        'flex h-[22px] items-center justify-between border-b border-divider px-[18px] py-[3px] text-xs font-sans text-ink',
        className
      )}
    >
      <div className="truncate">{deviceName}</div>
      <div className="flex h-full items-center gap-3">
        {airplane && (
          <span className="flex h-full items-center">
            <PaperAirplaneIcon size={20} className="rotate-[-90deg]" />
          </span>
        )}
        {celluar?.on && (
          <span className="flex h-full items-center text-[0.85em]">
            <RssIcon size={14} />
          </span>
        )}
        {typeof battery === 'number' && (
          <span className="flex h-full items-center gap-1">
            <span>{battery}%</span>
            {charging ? (
              <BatteryChargingIcon size={22} />
            ) : (
              <BatteryFullIcon size={22} />
            )}
          </span>
        )}
        <span className="flex h-full items-center">{displayTime}</span>
      </div>
    </div>
  )
}
