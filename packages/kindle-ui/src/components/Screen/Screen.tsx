import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from 'react'
import { EinkOverlay, type EinkOverlayHandle } from '../EinkOverlay/index.js'
import { cn } from '../../utils/cn.js'

export interface ScreenHandle {
  refresh: () => void
}

export interface ScreenProps {
  children?: ReactNode
  className?: string
  contentClassName?: string
  style?: React.CSSProperties
  overlay?: boolean
}

export const Screen = forwardRef<ScreenHandle, ScreenProps>(function Screen(
  { children, className, contentClassName, style, overlay = true },
  ref
) {
  const overlayRef = useRef<EinkOverlayHandle>(null)

  useImperativeHandle(ref, () => ({
    refresh: () => overlayRef.current?.refresh(),
  }))

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-screen border border-black/30 bg-paper shadow-screen',
        className
      )}
      style={style}
    >
      <div
        className={cn(
          'h-full w-full overflow-auto text-ink',
          'ku-grey-image',
          contentClassName
        )}
        style={{ filter: 'grayscale(100%) contrast(1.08)' }}
      >
        {children}
      </div>
      {overlay && (
        <EinkOverlay ref={overlayRef} className="absolute inset-0 h-full w-full" />
      )}
    </div>
  )
})
