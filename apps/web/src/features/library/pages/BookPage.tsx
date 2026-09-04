import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@bbbook/kindle-ui/components/Button'
import { Card, CardContent, CardTitle } from '@bbbook/kindle-ui/components/Card'
import { Section } from '@bbbook/kindle-ui/components/Section'
import { Typography } from '@bbbook/kindle-ui/components/Typography'
import { getErrorCode } from '../../../shared/lib/errors.js'
import { invalidateCached, useCached } from '../../../shared/lib/useCached.js'
import {
  deleteBook,
  fetchBooks,
  openBook,
  type Book,
  type BooksResponse,
} from '../api/library.js'
import { BOOKS_CACHE_KEY } from '../model/library.js'

export function BookPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const locationState = useLocation().state as Book | undefined
  const { data } = useCached<BooksResponse>({
    key: BOOKS_CACHE_KEY,
    fn: fetchBooks,
    ttl: 0,
  })
  const [deleting, setDeleting] = useState(false)
  const book = locationState ?? data?.books.find((item) => item.id === id)

  const performDelete = async () => {
    if (!book) return
    setDeleting(true)
    const toastId = toast.loading(t('library.deleting'))
    try {
      await deleteBook(book.fileName)
      invalidateCached(BOOKS_CACHE_KEY)
      navigate('/library')
      toast.success(t('library.deleteDone'), { id: toastId })
    } catch (error) {
      const code = getErrorCode(error)
      toast.error(t(`errors.${code}`, { defaultValue: code }), { id: toastId })
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
    return (
      <Section className="p-4">
        <Typography className="text-sm text-muted">
          {t('library.bookNotFound')}
        </Typography>
        <Button className="mt-4" onClick={() => navigate('/library')}>
          {t('common.back')}
        </Button>
      </Section>
    )
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
      <div className="flex gap-3">
        <Button onClick={() => void openBook(book.fileName)}>
          {t('library.open')}
        </Button>
        <Button variant="outline" loading={deleting} onClick={handleDelete}>
          {t('library.delete')}
        </Button>
      </div>
    </Section>
  )
}
