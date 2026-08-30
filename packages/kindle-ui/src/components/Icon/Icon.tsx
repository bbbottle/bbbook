import type { ComponentType } from 'react'
import {
  AirplaneIcon,
  BackIcon,
  BatteryChargingIcon,
  BatteryFullIcon,
  CloseIcon,
  HomeIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  WifiIcon,
} from '../../icons/index.js'

export type IconName =
  | 'home'
  | 'back'
  | 'settings'
  | 'battery'
  | 'battery-charging'
  | 'wifi'
  | 'airplane'
  | 'search'
  | 'close'
  | 'menu'

export interface IconProps {
  name: IconName
  className?: string
  size?: number
}

const icons: Record<IconName, ComponentType<{ size?: number; className?: string }>> = {
  home: HomeIcon,
  back: BackIcon,
  settings: SettingsIcon,
  battery: BatteryFullIcon,
  'battery-charging': BatteryChargingIcon,
  wifi: WifiIcon,
  airplane: AirplaneIcon,
  search: SearchIcon,
  close: CloseIcon,
  menu: MenuIcon,
}

export function Icon({ name, className, size = 24 }: IconProps) {
  const IconComponent = icons[name]
  if (!IconComponent) return null
  return <IconComponent size={size} className={className} />
}
