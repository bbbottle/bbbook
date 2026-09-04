import { useEffect, useSyncExternalStore } from 'react'
import type { Middleware } from 'swr'

let activeRequests = 0
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return activeRequests > 0
}

export function startApiRequest() {
  const wasLoading = getSnapshot()
  activeRequests += 1
  if (!wasLoading) notifyListeners()
}

export function finishApiRequest() {
  if (activeRequests === 0) return
  activeRequests -= 1
  if (!getSnapshot()) notifyListeners()
}

export function useApiLoading() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export const apiLoadingMiddleware: Middleware = (useSWRNext) =>
  function useTrackedSWR(key, fetcher, config) {
    const response = useSWRNext(key, fetcher, config)

    useEffect(() => {
      if (!response.isValidating) return
      startApiRequest()
      return finishApiRequest
    }, [response.isValidating])

    return response
  }
