import { type ElementType, type ReactNode, createElement } from 'react'
import { cn } from '../../utils/cn.js'

export interface ContainerProps {
  children?: ReactNode
  dark?: boolean
  deviceFrame?: ElementType
  className?: string
}

export function Container({ children, dark, deviceFrame, className }: ContainerProps) {
  const content = (
    <div className={cn(dark && 'dark', 'min-h-screen bg-surface font-sans text-ink', className)}>
      {children}
    </div>
  )

  if (deviceFrame) {
    return createElement(deviceFrame, { dark }, content)
  }

  return content
}
