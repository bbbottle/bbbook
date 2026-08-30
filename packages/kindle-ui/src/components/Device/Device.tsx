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
        'relative mx-auto w-[min(92vw,773px)] aspect-[773/1091] select-none overflow-hidden',
        'rounded-kindle border border-device-bezel bg-device-shell shadow-shell',
        className
      )}
    >
      <div
        className="pointer-events-none absolute overflow-hidden border border-[#222] bg-[#8d8f8d]"
        style={{
          left: '10.0746%',
          top: '7.0681%',
          width: '79.8507%',
          height: '75.3927%',
        }}
      >
        <Screen
          ref={screenRef}
          overlay={overlay}
          className="absolute"
          style={{
            left: '1.4019%',
            top: '1.3889%',
            width: '97.1963%',
            height: '97.2222%',
          }}
        >
          {children}
        </Screen>
        <img
          src="/assets/figma-screen-frame.svg"
          alt=""
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          aria-hidden="true"
        />
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 text-device-logo"
        style={{ top: '87.44%' }}
      >
        <span
          className="font-normal lowercase"
          style={{
            fontFamily: "'Amazon Ember', 'Helvetica Neue', Arial, sans-serif",
            fontSize: '20px',
            letterSpacing: '-1.2px',
          }}
        >
          kindle
        </span>
      </div>

      {homeButton && (
        <button
          type="button"
          onClick={handleHomeClick}
          className="absolute left-1/2 -translate-x-1/2 cursor-pointer rounded-full"
          style={{
            bottom: '1%',
            width: '38px',
            height: '10px',
          }}
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
