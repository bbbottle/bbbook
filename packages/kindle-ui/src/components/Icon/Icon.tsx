import type { ReactNode } from 'react'
import { ArrowLeftIcon } from '@primer/octicons-react/ArrowLeftIcon'
import { ChevronRightIcon } from '@primer/octicons-react/ChevronRightIcon'
import { DeviceMobileIcon } from '@primer/octicons-react/DeviceMobileIcon'
import { GearIcon } from '@primer/octicons-react/GearIcon'
import { GlobeIcon } from '@primer/octicons-react/GlobeIcon'
import { HomeIcon } from '@primer/octicons-react/HomeIcon'
import { PackageIcon } from '@primer/octicons-react/PackageIcon'
import { PaperAirplaneIcon } from '@primer/octicons-react/PaperAirplaneIcon'
import { PersonIcon } from '@primer/octicons-react/PersonIcon'
import { RssIcon } from '@primer/octicons-react/RssIcon'
import { SearchIcon } from '@primer/octicons-react/SearchIcon'
import { ThreeBarsIcon } from '@primer/octicons-react/ThreeBarsIcon'
import { XIcon } from '@primer/octicons-react/XIcon'
import { BatteryChargingIcon } from '../../icons/BatteryChargingIcon.js'
import { BatteryFullIcon } from '../../icons/BatteryFullIcon.js'

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
  | 'chevron-right'
  | 'account'
  | 'language'
  | 'device'

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
  'chevron-right': ChevronRightIcon,
  account: PersonIcon,
  language: GlobeIcon,
  device: DeviceMobileIcon,
}

export function Icon({ name, className, size = 24 }: IconProps) {
  const IconComponent = icons[name]
  if (!IconComponent) return null
  return <IconComponent size={size} className={className} />
}
