import { useSyncExternalStore } from 'react'

let currentTime = getTimeString()
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function getTimeString() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function scheduleNextMinute() {
  const delay = 60_000 - (Date.now() % 60_000) + 50
  timer = setTimeout(() => {
    currentTime = getTimeString()
    for (const listener of listeners) listener()
    scheduleNextMinute()
  }, delay)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    currentTime = getTimeString()
    scheduleNextMinute()
  }

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }
}

export function useMinuteTime() {
  return useSyncExternalStore(subscribe, () => currentTime, getTimeString)
}
