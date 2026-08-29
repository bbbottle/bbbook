import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn.js'

export interface TimeBarProps {
  className?: string
}

export function TimeBar({ className }: TimeBarProps) {
  const [time, setTime] = useState(() => getTimeString())

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeString()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className={cn(
        'flex h-5 items-center justify-center bg-paper text-xs font-sans text-muted',
        className
      )}
    >
      {time}
    </div>
  )
}

function getTimeString() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
