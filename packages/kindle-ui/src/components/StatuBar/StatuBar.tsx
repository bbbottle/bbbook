import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn.js'
import { Icon } from '../Icon/index.js'

export interface StatuBarProps {
  deviceName?: string
  time?: string
  battery?: number
  charging?: boolean
  airplane?: boolean
  wifi?: 'none' | 'low' | 'medium' | 'full'
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
  wifi,
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
      <div className="flex items-center gap-3">
        {airplane && (
          <span className="rotate-[-90deg]">
            <Icon name="airplane" size={18} />
          </span>
        )}
        {celluar?.on && (
          <span className="flex items-center gap-0.5 text-[0.85em]">
            {celluar.label && <span>{celluar.label}</span>}
            <CellularIcon level={celluar.signal ?? 3} />
          </span>
        )}
        {wifi && (
          <Icon
            name="wifi"
            size={18}
            className={wifi === 'none' ? 'opacity-30' : ''}
          />
        )}
        {typeof battery === 'number' && (
          <span className="flex items-center gap-0.5">
            <span>{battery}%</span>
            <Icon name={charging ? 'battery-charging' : 'battery'} size={20} />
          </span>
        )}
        <span>{displayTime}</span>
      </div>
    </div>
  )
}

function CellularIcon({ level = 3 }: { level?: number }) {
  const bars = Math.max(0, Math.min(4, level))
  const rects = [0, 1, 2, 3].map((i) => {
    const h = 3 + i * 2.5
    const active = i < bars
    return (
      <rect
        key={i}
        x={i * 3.5 + 1}
        y={12 - h}
        width={2.5}
        height={h}
        fill={active ? 'currentColor' : 'transparent'}
        stroke="currentColor"
        strokeWidth={0.5}
      />
    )
  })
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" className="shrink-0">
      {rects}
    </svg>
  )
}
