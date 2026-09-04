import { useSyncExternalStore } from 'react'

export function createStoredBoolean(key: string, fallback = false) {
  let value = read()
  const listeners = new Set<() => void>()

  function read() {
    try {
      return localStorage.getItem(key) === 'true'
    } catch {
      return fallback
    }
  }

  function emitChange() {
    for (const listener of listeners) listener()
  }

  function handleStorage(event: StorageEvent) {
    if (event.key !== key) return
    value = read()
    emitChange()
  }

  function subscribe(listener: () => void) {
    if (typeof window === 'undefined') return () => {}
    if (listeners.size === 0) window.addEventListener('storage', handleStorage)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0)
        window.removeEventListener('storage', handleStorage)
    }
  }

  return {
    useValue() {
      return useSyncExternalStore(
        subscribe,
        () => value,
        () => fallback
      )
    },
    set(nextValue: boolean) {
      value = nextValue
      try {
        if (nextValue) localStorage.setItem(key, 'true')
        else localStorage.removeItem(key)
      } catch {
        // Storage may be unavailable in restricted browser contexts.
      }
      emitChange()
    },
  }
}
