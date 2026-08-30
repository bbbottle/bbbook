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
      {/* Figma node 6:12 — screen-frame; radius 2px, no border */}
      <div
        className="pointer-events-none absolute overflow-hidden rounded-screenFrame px-[3px] py-[4px]"
        style={{
          left: '10.07462686567164%',
          top: '7.06806282722513%',
          width: '79.85074626865672%',
          height: '75.39267015706806%',
        }}
      >
        {/* Figma node 3:4 — screen; black border, inset shadow, grey off-state fill */}
        <div className="pointer-events-none absolute inset-0 border border-device-screen-border bg-device-screen">
          <Screen ref={screenRef} overlay={overlay} className="absolute inset-0" wallpaper={wallpaper}>
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
    </div>
  )
}
