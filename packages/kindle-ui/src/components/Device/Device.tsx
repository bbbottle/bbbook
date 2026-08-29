import { useRef, type ReactNode } from 'react'
import { Screen, type ScreenHandle } from '../Screen/index.js'
import { cn } from '../../utils/cn.js'

export interface DeviceProps {
  children?: ReactNode
  className?: string
  onHomeClick?: () => void
  overlay?: boolean
}

export function Device({ children, className, onHomeClick, overlay = true }: DeviceProps) {
  const screenRef = useRef<ScreenHandle>(null)

  const handleHomeClick = () => {
    screenRef.current?.refresh()
    onHomeClick?.()
  }

  return (
    <div
      className={cn(
        'relative mx-auto select-none',
        'rounded-kindle border border-device-bezel',
        'bg-gradient-to-br from-white via-device-shell to-device-bezel',
        'shadow-[0_2px_3px_rgba(0,0,0,0.16),0_18px_36px_rgba(0,0,0,0.28)]',
        className
      )}
      style={{
        width: 'min(92vw, 360px)',
        aspectRatio: '320 / 458',
      }}
    >
      {/* Subtle plastic grain */}
      <div
        className="pointer-events-none absolute inset-0 rounded-kindle opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <Screen
        ref={screenRef}
        overlay={overlay}
        className="absolute"
        style={{
          top: '34px',
          left: '30px',
          right: '30px',
          bottom: '66px',
        }}
      >
        {children}
      </Screen>

      {/* Bottom bezel branding */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{ bottom: '27px', height: '25px' }}
      >
        <span
          className="text-[8px] font-semibold tracking-[0.15em] text-subtle"
          style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
        >
          kindle
        </span>
      </div>

      {/* Home button */}
      <button
        type="button"
        onClick={handleHomeClick}
        className="absolute left-1/2 -translate-x-1/2 cursor-pointer rounded-full"
        style={{ bottom: '7px', width: '38px', height: '10px' }}
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
    </div>
  )
}
