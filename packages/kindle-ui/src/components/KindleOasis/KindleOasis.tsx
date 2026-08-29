import { type ReactNode } from 'react'
import { Screen } from '../Screen/index.js'
import { cn } from '../../utils/cn.js'

export interface KindleOasisProps {
  children?: ReactNode
  className?: string
  overlay?: boolean
}

export function KindleOasis({ children, className, overlay = true }: KindleOasisProps) {
  return (
    <div
      className={cn(
        'relative flex overflow-hidden rounded-[30px] border-8 border-double border-[#3a3737]',
        'bg-gradient-to-br from-[#6b6b6b] to-[#2a2a2a] shadow-shell',
        className
      )}
      style={{ aspectRatio: '0.89', maxHeight: '80vh' }}
    >
      <Screen overlay={overlay} className="m-5 h-full flex-1">
        {children}
      </Screen>

      <div className="flex w-20 flex-col items-center justify-center gap-12 border-l border-black/20 py-16">
        <div
          className="h-20 w-3 rounded-full bg-[#414449]"
          style={{ boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.2)' }}
        />
        <div
          className="h-20 w-3 rounded-full bg-[#414449]"
          style={{ boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.2)' }}
        />
      </div>
    </div>
  )
}
