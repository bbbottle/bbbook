import { cn } from '../../utils/cn.js'

export interface ListItemTextProps {
  primary?: string
  secondary?: string
  allowWrap?: boolean
  className?: string
}

export function ListItemText({
  primary,
  secondary,
  allowWrap = false,
  className,
}: ListItemTextProps) {
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col justify-center', className)}>
      {primary != null ? (
        <div
          className={cn(
            'truncate text-base font-sans font-semibold text-ink',
            allowWrap && 'whitespace-normal'
          )}
        >
          {primary}
        </div>
      ) : null}
      {secondary != null ? (
        <div className="truncate text-sm font-sans text-muted">{secondary}</div>
      ) : null}
    </div>
  )
}
