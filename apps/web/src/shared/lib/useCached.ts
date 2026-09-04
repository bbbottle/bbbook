import { useCallback, useEffect, useRef, useState } from 'react'

interface CacheEntry<T> {
  value: T
  timestamp: number
  requestId: number
}

interface PromiseEntry<T> {
  promise: Promise<T>
  requestId: number
}

const dataCache = new Map<string, CacheEntry<unknown>>()
const promiseCache = new Map<string, PromiseEntry<unknown>>()
const requestIds = new Map<string, number>()
const refreshListeners = new Map<string, Set<() => void>>()

function nextRequestId(key: string): number {
  const id = (requestIds.get(key) ?? 0) + 1
  requestIds.set(key, id)
  return id
}

function isCurrentRequest(key: string, requestId: number): boolean {
  return requestIds.get(key) === requestId
}

function getCached<T>(key: string, ttl?: number): T | undefined {
  const entry = dataCache.get(key) as CacheEntry<T> | undefined
  if (!entry) return undefined
  if (ttl !== undefined && Date.now() - entry.timestamp >= ttl) {
    dataCache.delete(key)
    return undefined
  }
  return entry.value
}

function subscribeRefresh(key: string, callback: () => void) {
  const listeners = refreshListeners.get(key) ?? new Set<() => void>()
  listeners.add(callback)
  refreshListeners.set(key, listeners)
  return () => {
    listeners.delete(callback)
    if (listeners.size === 0) {
      refreshListeners.delete(key)
    }
  }
}

function notifyListeners(key: string) {
  const listeners = refreshListeners.get(key)
  if (listeners) {
    Array.from(listeners).forEach((cb) => cb())
  }
}

export function invalidateCached(key: string) {
  dataCache.delete(key)
  promiseCache.delete(key)
  nextRequestId(key)
  notifyListeners(key)
}

export function revalidateCached(key: string) {
  promiseCache.delete(key)
  nextRequestId(key)
  notifyListeners(key)
}

interface UseCachedOptions<T> {
  key: string | null | undefined
  fn: () => Promise<T>
  ttl?: number
}

interface UseCachedResult<T> {
  data: T | undefined
  error: unknown
  loading: boolean
  refresh: () => void
  revalidate: () => void
}

export function useCached<T>({
  key,
  fn,
  ttl,
}: UseCachedOptions<T>): UseCachedResult<T> {
  const fnRef = useRef(fn)
  fnRef.current = fn

  const clearOnNextTick = useRef(false)
  const [tick, setTick] = useState(0)
  const [state, setState] = useState<{
    data: T | undefined
    error: unknown
    loading: boolean
  }>(() => {
    if (key) {
      const cached = getCached<T>(key, ttl)
      if (cached !== undefined) {
        return { data: cached, error: undefined, loading: false }
      }
    }
    return { data: undefined, error: undefined, loading: key != null }
  })

  useEffect(() => {
    if (!key) return
    return subscribeRefresh(key, () => setTick((t) => t + 1))
  }, [key])

  useEffect(() => {
    if (!key) {
      setState({ data: undefined, error: undefined, loading: false })
      return
    }

    const cached = getCached<T>(key, ttl)
    if (cached !== undefined && tick === 0) {
      setState({ data: cached, error: undefined, loading: false })
      return
    }

    const clearData = clearOnNextTick.current
    clearOnNextTick.current = false
    setState((prev) => ({
      data: clearData ? undefined : prev.data,
      error: undefined,
      loading: true,
    }))

    let promiseEntry = promiseCache.get(key) as PromiseEntry<T> | undefined
    let requestId: number
    if (!promiseEntry) {
      requestId = nextRequestId(key)
      const inner = fnRef.current()
      const promise: Promise<T> = inner
        .then(
          (value) => {
            if (isCurrentRequest(key, requestId)) {
              dataCache.set(key, { value, timestamp: Date.now(), requestId })
            }
            return value
          },
          (reason: unknown) => {
            throw reason
          }
        )
        .finally(() => {
          const current = promiseCache.get(key)
          if (current?.promise === promise) {
            promiseCache.delete(key)
          }
        })
      promiseEntry = { promise, requestId }
      promiseCache.set(key, promiseEntry)
    } else {
      requestId = promiseEntry.requestId
    }

    let stale = false
    promiseEntry.promise
      .then((value) => {
        if (stale) return
        if (!isCurrentRequest(key, requestId)) return
        setState({ data: value, error: undefined, loading: false })
      })
      .catch((err: unknown) => {
        if (stale) return
        if (!isCurrentRequest(key, requestId)) return
        setState((prev) => ({ ...prev, error: err, loading: false }))
      })

    return () => {
      stale = true
    }
  }, [key, tick, ttl])

  const refresh = useCallback(() => {
    if (!key) return
    clearOnNextTick.current = true
    invalidateCached(key)
  }, [key])

  const revalidate = useCallback(() => {
    if (!key) return
    revalidateCached(key)
  }, [key])

  return {
    data: state.data,
    error: state.error,
    loading: state.loading,
    refresh,
    revalidate,
  }
}
