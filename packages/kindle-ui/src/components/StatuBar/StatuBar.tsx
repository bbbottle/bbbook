import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn.js'
import {
  AirplaneIcon,
  BatteryChargingIcon,
  BatteryFullIcon,
  CellularIcon,
} from '../../icons/index.js'

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

function getTimeString() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
  const [liveTime, setLiveTime] = useState(time ?? getTimeString())

  useEffect(() => {
    if (time) return
    const id = setInterval(() => setLiveTime(getTimeString()), 1000)
    return () => clearInterval(id)
  }, [time])

  const displayTime = time ?? liveTime

  return (
    <div
      className={cn(
        'flex h-[22px] items-center justify-between border-b border-divider px-[18px] py-[3px] text-xs font-sans text-muted',
        className
      )}
    >
      <div className="truncate">{deviceName}</div>
      <div className="flex h-full items-center gap-3">
        {airplane && (
          <span className="flex h-full items-center">
            <AirplaneIcon size={20} className="rotate-[-90deg]" />
          </span>
        )}
        {celluar?.on && (
          <span className="flex h-full items-center gap-0.5 text-[0.85em]">
            {celluar.label && <span>{celluar.label}</span>}
            <CellularIcon size={20} signal={celluar.signal} />
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


