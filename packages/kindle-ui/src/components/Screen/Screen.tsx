import {
  useImperativeHandle,
  useRef,
  forwardRef,
  type ReactNode,
  type CSSProperties,
} from 'react'
import { EinkOverlay, type EinkOverlayHandle } from '../EinkOverlay/index.js'
import { cn } from '../../utils/cn.js'

export interface ScreenProps {
  children?: ReactNode
  overlay?: boolean
  className?: string
  style?: CSSProperties
  wallpaper?: string | false
}

export interface ScreenHandle {
  refresh: () => void
}

export const Screen = forwardRef<ScreenHandle, ScreenProps>(function Screen(
  { children, overlay = true, className, style, wallpaper },
  ref
) {
  const einkRef = useRef<EinkOverlayHandle>(null)

  useImperativeHandle(ref, () => ({
    refresh: () => {
      einkRef.current?.refresh()
    },
  }))

  // No automatic flash on mount: the e-ink overlay starts at its steady-state
  // screen tone so the Device renders at the intended #8D8F8D immediately.

  const hasWallpaper = Boolean(wallpaper)
  const contentClass = cn(
    'min-h-full w-full',
    hasWallpaper ? 'relative' : 'bg-paper'
  )
  const renderContent = (
    <>
      {hasWallpaper && (
        <img
          src={String(wallpaper)}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          aria-hidden="true"
        />
      )}
      {children}
    </>
  )

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-paper text-base',
        className
      )}
      style={style}
    >
      {overlay ? (
        <EinkOverlay
          ref={einkRef}
          className="absolute inset-0"
        >
          <div className={contentClass}>{renderContent}</div>
        </EinkOverlay>
      ) : (
        <div className={contentClass}>{renderContent}</div>
      )}
    </div>
  )
})
