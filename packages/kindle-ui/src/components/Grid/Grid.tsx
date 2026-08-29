import { Children, cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react'
import { cn } from '../../utils/cn.js'

export interface GridProps {
  children?: ReactNode
  gap?: number
  rowGap?: number
  dense?: boolean
  className?: string
}

export function Grid({ children, gap = 8, rowGap = 4, dense = false, className }: GridProps) {
  const gridCols = dense ? 'grid-cols-4 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'

  return (
    <div
      className={cn('grid', gridCols, className)}
      style={{ gap, rowGap }}
    >
      {Children.map(children, (child) => {
        if (isValidElement<GridItemProps>(child)) {
          return cloneElement(child as ReactElement<GridItemProps>, { dense })
        }
        return child
      })}
    </div>
  )
}

export interface GridItemProps {
  children?: ReactNode
  src?: string
  href?: string
  target?: string
  dense?: boolean
  className?: string
}

export function GridItem({
  children,
  src,
  href,
  target,
  className,
}: GridItemProps) {
  const content = src ? (
    <img
      src={src}
      alt="grid item"
      className="h-full w-full object-contain grayscale"
    />
  ) : (
    children
  )

  return (
    <div className={cn('flex aspect-[2/3] w-full items-center justify-center bg-paper', className)}>
      {href ? (
        <a href={href} target={target} className="h-full w-full">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  )
}
