import type { Book } from '@bbbook/shared-types'
import {
  API_BASE_URL,
  get,
  parseApiError,
  post,
  remove,
} from '../../../shared/api/client.js'
import {
  finishApiRequest,
  startApiRequest,
} from '../../../shared/api/loading.js'
import { getAuthHeaders } from '../../../shared/auth/session.js'

export interface BooksResponse {
  books: ReadonlyArray<Book>
}

export type { Book }

export function fetchBooks(): Promise<BooksResponse> {
  return get('/kindle/books')
}

export async function uploadBook(
  file: File,
  onProgress?: (progress: number, status: 'uploading' | 'processing') => void
): Promise<{ success: true }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress?.(progress, progress === 100 ? 'processing' : 'uploading')
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true })
      } else {
        let payload: unknown
        try {
          payload = JSON.parse(xhr.responseText)
        } catch {
          payload = {}
        }
        const { code } = parseApiError(payload)
        reject(Object.assign(new Error(code), { code, status: xhr.status }))
      }
    }

    xhr.onerror = () =>
      reject(
        Object.assign(new Error('NETWORK_ERROR'), {
          code: 'NETWORK_ERROR',
          status: 0,
        })
      )
    xhr.onabort = () =>
      reject(
        Object.assign(new Error('UPLOAD_ABORTED'), {
          code: 'UPLOAD_ABORTED',
          status: 0,
        })
      )
    xhr.onloadend = finishApiRequest

    xhr.open('POST', `${API_BASE_URL}/kindle/books`)
    const headers = getAuthHeaders()
    Object.entries(headers).forEach(([key, value]) =>
      xhr.setRequestHeader(key, value)
    )
    startApiRequest()
    try {
      xhr.send(formData)
    } catch (error) {
      finishApiRequest()
      reject(error)
    }
  })
}

export function deleteBook(fileName: string): Promise<{ success: true }> {
  return remove(`/kindle/books/${encodeURIComponent(fileName)}`)
}

export function openBook(fileName: string): Promise<{ success: true }> {
  return post(`/kindle/books/${encodeURIComponent(fileName)}/open`)
}

export function restoreBook(fileName: string): Promise<{ success: true }> {
  return post(`/kindle/books/${encodeURIComponent(fileName)}/restore`)
}
