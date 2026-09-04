import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useOutletContext } from 'react-router-dom'
import useSWR from 'swr'
import { List } from '@bbbook/kindle-ui/components/List'
import { ListItem } from '@bbbook/kindle-ui/components/ListItem'
import { Section } from '@bbbook/kindle-ui/components/Section'
import { Typography } from '@bbbook/kindle-ui/components/Typography'
import type { AppOutletContext } from '../../../app/layout/context.js'
import { fetchBooks, type BooksResponse } from '../api/library.js'
import { BOOKS_CACHE_KEY } from '../model/library.js'

const PULL_THRESHOLD = 80
const PULL_MAX = 120

export function LibraryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { query, mainRef } = useOutletContext<AppOutletContext>()
  const deferredQuery = useDeferredValue(query)
  const { data, mutate } = useSWR<BooksResponse>(
    BOOKS_CACHE_KEY,
    fetchBooks
  )
  const pullRef = useRef<HTMLDivElement>(null)
  const pullWillRefreshRef = useRef(false)
  const [pullWillRefresh, setPullWillRefresh] = useState(false)

  useEffect(() => {
    const element = mainRef.current
    if (!element) return

    let startY = 0
    let isPulling = false
    const resetPull = () => {
      if (pullRef.current) pullRef.current.style.height = '0px'
      if (pullWillRefreshRef.current) {
        pullWillRefreshRef.current = false
        setPullWillRefresh(false)
      }
    }
    const onTouchStart = (event: TouchEvent) => {
      if (element.scrollTop === 0) {
        startY = event.touches[0].clientY
        isPulling = true
      }
    }
    const onTouchMove = (event: TouchEvent) => {
      if (!isPulling) return
      if (element.scrollTop > 0) {
        isPulling = false
        resetPull()
        return
      }
      const delta = event.touches[0].clientY - startY
      if (delta > 0) event.preventDefault()
      const distance = Math.min(Math.max(delta, 0) * 0.5, PULL_MAX)
      if (pullRef.current) pullRef.current.style.height = `${distance}px`
      const shouldRefresh = distance > PULL_THRESHOLD
      if (shouldRefresh !== pullWillRefreshRef.current) {
        pullWillRefreshRef.current = shouldRefresh
        setPullWillRefresh(shouldRefresh)
      }
    }
    const onTouchEnd = () => {
      if (!isPulling) return
      isPulling = false
      const shouldRefresh = pullWillRefreshRef.current
      resetPull()
      if (shouldRefresh) void mutate()
    }
    const onTouchCancel = () => {
      if (!isPulling) return
      isPulling = false
      resetPull()
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', onTouchEnd)
    element.addEventListener('touchcancel', onTouchCancel)
    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', onTouchEnd)
      element.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [mainRef, mutate])

  const filteredBooks = useMemo(() => {
    const books = data?.books ?? []
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    if (!normalizedQuery) return books
    return books.filter((book) =>
      (book.title || book.fileName).toLowerCase().includes(normalizedQuery)
    )
  }, [data?.books, deferredQuery])

  return (
    <Section className="flex flex-col">
      <div
        ref={pullRef}
        className="flex items-end justify-center overflow-hidden text-center text-sm text-muted transition-none"
        style={{ height: 0 }}
      >
        <span className="pb-2">
          {pullWillRefresh
            ? t('library.releaseToRefresh')
            : t('library.pullToRefresh')}
        </span>
      </div>

      {data && filteredBooks.length === 0 ? (
        <Typography className="px-4 py-6 text-sm text-muted">
          {deferredQuery ? t('library.noSearchResults') : t('library.empty')}
        </Typography>
      ) : null}

      <List className="flex-1">
        {filteredBooks.map((book) => (
          <ListItem
            key={book.id}
            className="[content-visibility:auto] [contain-intrinsic-size:auto_56px]"
            title={book.title || book.fileName}
            subtitle={book.author || book.fileName}
            onClick={() =>
              navigate(`/books/${encodeURIComponent(book.id)}`, { state: book })
            }
          />
        ))}
      </List>
    </Section>
  )
}
