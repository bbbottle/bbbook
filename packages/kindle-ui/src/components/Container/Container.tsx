import { type ElementType, type ReactNode, createElement } from 'react'
import { cn } from '../../utils/cn.js'

export interface ContainerProps {
  children?: ReactNode
  deviceFrame?: ElementType
  className?: string
}

export function Container({ children, deviceFrame, className }: ContainerProps) {
  const content = (
    <div className={cn('min-h-screen bg-surface font-sans text-ink', className)}>
      {children}
    </div>
  )

  if (deviceFrame) {
    return createElement(deviceFrame, {}, content)
  }

  return content
}
