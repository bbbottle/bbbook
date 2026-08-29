import { cn } from '../../utils/cn.js'
import { Icon } from '../Icon/index.js'

export interface StatusBarProps {
  deviceName?: string
  time?: string
  battery?: number
  charging?: boolean
  airplane?: boolean
  wifi?: 'none' | 'low' | 'medium' | 'full'
  className?: string
}

export function StatusBar({
  deviceName = 'Kindle',
  time,
  battery,
  charging = false,
  airplane = false,
  wifi,
  className,
}: StatusBarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-divider px-4 py-1 text-xs font-sans text-muted',
        className
      )}
    >
      <div className="truncate">{deviceName}</div>
      <div className="flex items-center gap-3">
        {airplane && <Icon name="airplane" size={18} />}
        {wifi && <Icon name="wifi" size={18} className={wifi === 'none' ? 'opacity-30' : ''} />}
        {typeof battery === 'number' && (
          <div className="flex items-center gap-1">
            <span>{battery}%</span>
            <Icon name={charging ? 'battery-charging' : 'battery'} size={18} />
          </div>
        )}
        {time && <span>{time}</span>}
      </div>
    </div>
  )
}
