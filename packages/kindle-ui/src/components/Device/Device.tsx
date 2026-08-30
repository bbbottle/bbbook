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
        'relative mx-auto w-[min(92vw,776px)] aspect-[776/1094] select-none overflow-hidden',
        'rounded-kindle border border-device-bezel bg-device-shell shadow-shell',
        className
      )}
      style={{ containerType: 'inline-size' }}
    >
      {/* Figma node 6:12 — screen-frame; radius 2px, no border */}
      <div
        className="pointer-events-none absolute overflow-hidden rounded-screenFrame"
        style={{
          left: '10.07462686567164%',
          top: '7.06806282722513%',
          width: '79.85074626865672%',
          height: '75.39267015706806%',
        }}
      >
        {/* Figma node 3:4 — screen; black border, inset shadow, grey off-state fill */}
        <div className="pointer-events-none absolute left-1/2 top-[1.38888888888889%] h-[97.22222222222221%] w-[97.19626168224299%] -translate-x-1/2 border border-device-screen-border bg-device-screen">
          <Screen ref={screenRef} overlay={overlay} className="absolute inset-0">
            {children}
          </Screen>
          <div
            className="pointer-events-none absolute inset-0 shadow-screen"
            aria-hidden="true"
          />
        </div>

        <img
          src="/assets/figma-screen-frame.svg"
          alt=""
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          aria-hidden="true"
        />
      </div>

      {/* Figma node 5:2 — kindle logo; scales with device width */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-device-logo"
        style={{ top: '87.43455497382199%' }}
      >
        <span
          className="font-normal lowercase"
          style={{
            fontFamily: "'Amazon Ember', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(12px, 7.46268656716418cqw, 58px)',
            letterSpacing: '-0.06em',
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
            width: '14.17910447761194cqw',
            height: '3.73134328358209cqw',
          }}
          aria-label="Home"
        >
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: '6.71641791044776cqw',
              height: '1.49253731343284cqw',
              background: 'linear-gradient(#aaa8a2, #e3e1db)',
              boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.24)',
            }}
          />
        </button>
      )}
    </div>
  )
}
