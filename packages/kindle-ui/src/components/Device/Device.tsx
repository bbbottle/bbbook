import { useRef, type ReactNode } from 'react'
import { Screen, type ScreenHandle } from '../Screen/index.js'
import { cn } from '../../utils/cn.js'

export interface DeviceProps {
  children?: ReactNode
  className?: string
  onHomeClick?: () => void
  homeButton?: boolean
  overlay?: boolean
}

export function Device({
  children,
  className,
  onHomeClick,
  homeButton = false,
  overlay = true,
}: DeviceProps) {
  const screenRef = useRef<ScreenHandle>(null)

  const handleHomeClick = () => {
    screenRef.current?.refresh()
    onHomeClick?.()
  }

  return (
    <div
      className={cn(
        'relative mx-auto select-none overflow-hidden',
        'rounded-kindle border border-device-bezel',
        'bg-gradient-to-br from-[#faf8f2] via-device-shell to-[#e8e4d9]',
        'shadow-shell',
        className
      )}
      style={{
        width: 'min(92vw, 420px)',
        aspectRatio: '10 / 14.45',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-kindle opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="pointer-events-none absolute inset-0 rounded-kindle bg-gradient-to-br from-white/30 via-transparent to-black/[0.03]" />

      <Screen
        ref={screenRef}
        overlay={overlay}
        className="absolute"
        style={{
          top: '38px',
          left: '28px',
          right: '28px',
          bottom: '82px',
        }}
      >
        {children}
      </Screen>

      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{ bottom: '28px', height: '28px' }}
      >
        <span
          className="text-[17px] font-normal tracking-[0.14em] text-device-logo"
          style={{ fontFamily: "'Amazon Ember', 'Helvetica Neue', Arial, sans-serif" }}
        >
          kindle
        </span>
      </div>

      {homeButton && (
        <button
          type="button"
          onClick={handleHomeClick}
          className="absolute left-1/2 -translate-x-1/2 cursor-pointer rounded-full"
          style={{ bottom: '6px', width: '38px', height: '10px' }}
          aria-label="Home"
        >
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: '18px',
              height: '4px',
              background: 'linear-gradient(#aaa8a2, #e3e1db)',
              boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.24)',
            }}
          />
        </button>
      )}
    </div>
  )
}
