import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { uploadBook } from '../api/library.js'
import {
  BOOK_FILE_ACCEPT,
  BOOKS_CACHE_KEY,
  isAllowedBookFile,
} from './library.js'
import { getErrorCode } from '../../../shared/lib/errors.js'

export function useBookUpload() {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const localizeError = useCallback(
    (code: string) => t(`errors.${code}`, { defaultValue: code }),
    [t]
  )

  const handleChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || uploading) return

      if (!isAllowedBookFile(file.name)) {
        toast.error(localizeError('INVALID_REQUEST_BODY'))
        event.target.value = ''
        return
      }

      setUploading(true)
      const toastId = toast.loading(t('library.uploading'))
      try {
        await uploadBook(file, (progress, status) => {
          const message =
            status === 'processing'
              ? t('library.processing')
              : `${t('library.uploading')} ${progress}%`
          toast.loading(message, { id: toastId })
        })
        await mutate(BOOKS_CACHE_KEY, undefined, { revalidate: true })
        toast.success(t('library.uploadDone'), { id: toastId })
      } catch (error) {
        toast.error(
          localizeError(getErrorCode(error)) || t('library.uploadFailed'),
          { id: toastId }
        )
      } finally {
        setUploading(false)
        event.target.value = ''
      }
    },
    [localizeError, t, uploading]
  )
  const openFilePicker = useCallback(() => inputRef.current?.click(), [])

  return {
    inputRef,
    uploading,
    openFilePicker,
    inputProps: {
      accept: BOOK_FILE_ACCEPT,
      onChange: handleChange,
    },
  }
}
