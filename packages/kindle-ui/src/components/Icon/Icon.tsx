import type { ReactNode } from 'react'
import {
  ArrowLeftIcon,
  GearIcon,
  HomeIcon,
  PackageIcon,
  PaperAirplaneIcon,
  RssIcon,
  SearchIcon,
  ThreeBarsIcon,
  XIcon,
} from '@primer/octicons-react'
import { BatteryChargingIcon, BatteryFullIcon } from '../../icons/index.js'

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
  | 'store'

export interface IconProps {
  name: IconName
  className?: string
  size?: number
}

type IconComponent = (props: { size?: number; className?: string }) => ReactNode

const icons: Record<IconName, IconComponent> = {
  home: HomeIcon,
  back: ArrowLeftIcon,
  settings: GearIcon,
  battery: BatteryFullIcon,
  'battery-charging': BatteryChargingIcon,
  wifi: RssIcon,
  airplane: PaperAirplaneIcon,
  search: SearchIcon,
  close: XIcon,
  menu: ThreeBarsIcon,
  store: PackageIcon,
}

export function Icon({ name, className, size = 24 }: IconProps) {
  const IconComponent = icons[name]
  if (!IconComponent) return null
  return <IconComponent size={size} className={className} />
}
