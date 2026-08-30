import { useRef, type ReactNode } from 'react'
import { Screen, type ScreenHandle } from '../Screen/index.js'
import { cn } from '../../utils/cn.js'

export interface DeviceProps {
  children?: ReactNode
  className?: string
  overlay?: boolean
  wallpaper?: string | false
}

export function Device({
  children,
  className,
  overlay = true,
  wallpaper = '/assets/wallpaper.png',
}: DeviceProps) {
  const screenRef = useRef<ScreenHandle>(null)

  return (
    <div
      className={cn(
        'relative mx-auto aspect-[268/382] select-none overflow-hidden',
        'rounded-kindle border border-device-bezel bg-device-shell shadow-shell',
        className
      )}
      style={{
        containerType: 'inline-size',
        width: 'min(92vw, calc(90vh * 268 / 382), 772px)',
      }}
    >
      {/* Figma node 6:12 — screen-frame; 2px radius, no border, four bevelled edges */}
      <div
        className="pointer-events-none absolute overflow-hidden rounded-screenFrame"
        style={{
          left: '10.07462686567164%',
          top: '7.06806282722513%',
          width: '79.85074626865672%',
          height: '75.39267015706806%',
        }}
      >
        {/* Bevel edges derived from Figma 6:12 geometry.
            +1px overlap ensures the screen layer covers any sub-pixel gap. */}
        <div
          className="absolute inset-x-0 top-0 z-0 bg-device-screenframe-top"
          style={{ height: 'calc((4 / 288) * 100% + 1px)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-0 bg-device-screenframe-bottom"
          style={{ height: 'calc((4 / 288) * 100% + 1px)' }}
        />
        <div
          className="absolute inset-y-0 left-0 z-0 bg-device-screenframe-left"
          style={{ width: 'calc((3 / 214) * 100% + 1px)' }}
        />
        <div
          className="absolute inset-y-0 right-0 z-0 bg-device-screenframe-right"
          style={{ width: 'calc((3 / 214) * 100% + 1px)' }}
        />

        {/* Figma node 3:4 — screen; black 1px border, inset shadow, grey off-state fill */}
        <div
          className="pointer-events-none absolute z-10 border border-device-screen-border bg-device-screen"
          style={{
            top: 'calc((4 / 288) * 100%)',
            bottom: 'calc((4 / 288) * 100%)',
            left: 'calc((3 / 214) * 100%)',
            right: 'calc((3 / 214) * 100%)',
          }}
        >
          <Screen ref={screenRef} overlay={overlay} className="absolute inset-0" wallpaper={wallpaper}>
            {children}
          </Screen>
          <div
            className="pointer-events-none absolute inset-0 shadow-screen"
            aria-hidden="true"
          />
        </div>
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
    </div>
  )
}
