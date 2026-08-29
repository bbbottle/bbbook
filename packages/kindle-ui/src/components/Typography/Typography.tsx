import { cn } from '../../utils/cn.js'

export interface TypographyProps {
  children?: React.ReactNode
  className?: string
  greyImage?: boolean
}

export function Typography({ children, className, greyImage = true }: TypographyProps) {
  return (
    <article
      className={cn(
        'max-w-none font-serif text-base leading-relaxed tracking-wide text-ink',
        '[&>h1]:text-3xl [&>h1]:font-normal [&>h1]:my-4',
        '[&>h2]:text-2xl [&>h2]:font-normal [&>h2]:my-3',
        '[&>h3]:text-xl [&>h3]:font-normal [&>h3]:my-3',
        '[&>p]:my-3',
        '[&>a]:text-ink [&>a]:underline',
        '[&>blockquote]:border-l-4 [&>blockquote]:border-subtle [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted',
        greyImage && 'ku-grey-image',
        className
      )}
    >
      {children}
    </article>
  )
}
