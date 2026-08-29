import {
  useEffect,
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
}

export interface ScreenHandle {
  refresh: () => void
}

export const Screen = forwardRef<ScreenHandle, ScreenProps>(function Screen(
  { children, overlay = true, className, style },
  ref
) {
  const einkRef = useRef<EinkOverlayHandle>(null)

  useImperativeHandle(ref, () => ({
    refresh: () => {
      einkRef.current?.refresh()
    },
  }))

  useEffect(() => {
    const id = setTimeout(() => einkRef.current?.refresh(), 50)
    return () => clearTimeout(id)
  }, [])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-screen',
        'border border-device-screen-border bg-paper',
        'shadow-[inset_0_2px_10px_rgba(0,0,0,0.16)]',
        className
      )}
      style={style}
    >
      {overlay ? (
        <EinkOverlay
          ref={einkRef}
          className="absolute inset-0"
        >
          <div className="min-h-full w-full bg-paper">{children}</div>
        </EinkOverlay>
      ) : (
        <div className="min-h-full w-full bg-paper">{children}</div>
      )}
    </div>
  )
})
