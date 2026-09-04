export const ALLOWED_BOOK_EXTENSIONS = [
  'azw',
  'azw3',
  'mobi',
  'epub',
  'pdf',
] as const
export const BOOKS_CACHE_KEY = 'kindle-books'

export const BOOK_FILE_ACCEPT = ALLOWED_BOOK_EXTENSIONS.map(
  (extension) => `.${extension}`
).join(',')

export function isAllowedBookFile(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return ALLOWED_BOOK_EXTENSIONS.some((allowed) => allowed === extension)
}
