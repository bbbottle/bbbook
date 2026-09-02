import { useCallback, useEffect, useRef, useState } from 'react'

const dataCache = new Map<string, unknown>()
const promiseCache = new Map<string, Promise<unknown>>()

interface UseCachedOptions<T> {
  key: string | null | undefined
  fn: () => Promise<T>
}

interface UseCachedResult<T> {
  data: T | undefined
  error: unknown
  loading: boolean
  refresh: () => void
}

export function useCached<T>({ key, fn }: UseCachedOptions<T>): UseCachedResult<T> {
  const fnRef = useRef(fn)
  fnRef.current = fn

  const [tick, setTick] = useState(0)
  const [state, setState] = useState<{ data: T | undefined; error: unknown; loading: boolean }>(() => {
    if (key && dataCache.has(key)) {
      return { data: dataCache.get(key) as T, error: undefined, loading: false }
    }
    return { data: undefined, error: undefined, loading: key != null }
  })

  useEffect(() => {
    if (!key) {
      setState({ data: undefined, error: undefined, loading: false })
      return
    }

    const cached = dataCache.get(key) as T | undefined
    if (cached !== undefined) {
      setState({ data: cached, error: undefined, loading: false })
      return
    }

    setState({ data: undefined, error: undefined, loading: true })

    let promise = promiseCache.get(key) as Promise<T> | undefined
    if (!promise) {
      promise = fnRef.current().then(
        (value) => {
          dataCache.set(key, value)
          promiseCache.delete(key)
          return value
        },
        (reason: unknown) => {
          promiseCache.delete(key)
          throw reason
        }
      )
      promiseCache.set(key, promise)
    }

    let stale = false
    promise
      .then((value) => {
        if (stale) return
        setState({ data: value, error: undefined, loading: false })
      })
      .catch((err: unknown) => {
        if (stale) return
        setState({ data: undefined, error: err, loading: false })
      })

    return () => {
      stale = true
    }
  }, [key, tick])

  const refresh = useCallback(() => {
    if (!key) return
    dataCache.delete(key)
    promiseCache.delete(key)
    setTick((t) => t + 1)
  }, [key])

  return { data: state.data, error: state.error, loading: state.loading, refresh }
}
