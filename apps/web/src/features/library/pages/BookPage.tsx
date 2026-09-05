import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import useSWR, { mutate } from 'swr'
import { Button } from '@bbbook/kindle-ui/components/Button'
import { Card, CardContent, CardTitle } from '@bbbook/kindle-ui/components/Card'
import { Section } from '@bbbook/kindle-ui/components/Section'
import { Typography } from '@bbbook/kindle-ui/components/Typography'
import { getErrorCode } from '../../../shared/lib/errors.js'
import {
  deleteBook,
  fetchBooks,
  type Book,
  type BooksResponse,
} from '../api/library.js'
import { BOOKS_CACHE_KEY } from '../model/library.js'

export function BookPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const locationState = useLocation().state as Book | undefined
  const { data } = useSWR<BooksResponse>(BOOKS_CACHE_KEY, fetchBooks)
  const [deleting, setDeleting] = useState(false)
  const book = locationState ?? data?.books.find((item) => item.id === id)

  const performDelete = async () => {
    if (!book) return
    setDeleting(true)
    try {
      await deleteBook(book.fileName)
      await mutate(BOOKS_CACHE_KEY, undefined, { revalidate: false })
      navigate('/library')
      toast.success(t('library.deleteDone'))
    } catch (error) {
      const code = getErrorCode(error)
      toast.error(t(`errors.${code}`, { defaultValue: code }))
    } finally {
      setDeleting(false)
    }
  }

  const handleDelete = () => {
    if (!book || deleting) return
    const confirmId = toast(
      t('library.deleteConfirm', { fileName: book.fileName }),
      {
        duration: Infinity,
        action: {
          label: t('common.confirm'),
          onClick: () => {
            toast.dismiss(confirmId)
            void performDelete()
          },
        },
        cancel: {
          label: t('common.cancel'),
          onClick: () => toast.dismiss(confirmId),
        },
      }
    )
  }

  if (!book) {
    return null
  }

  return (
    <Section className="flex flex-col gap-4 p-4">
      <Card>
        <CardTitle>{book.title || book.fileName}</CardTitle>
        <CardContent>
          <Typography className="text-sm text-muted">
            {t('library.fileName')}: {book.fileName}
          </Typography>
          {book.author ? (
            <Typography className="text-sm text-muted">
              {t('library.author')}: {book.author}
            </Typography>
          ) : null}
          {book.path ? (
            <Typography className="text-sm text-muted">{book.path}</Typography>
          ) : null}
        </CardContent>
      </Card>
      <Button variant="outline" disabled={deleting} onClick={handleDelete}>
        {t('library.delete')}
      </Button>
    </Section>
  )
}
