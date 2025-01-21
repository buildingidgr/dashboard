"use client"

import { useEffect, useState } from 'react'
import { usePreferences } from '@/hooks/use-preferences'

export function Clock() {
  const { preferences } = usePreferences()
  const [time, setTime] = useState<string>('')

  // Function to format the current time
  const formatTime = () => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: preferences?.dashboard.timezone || 'UTC'
    }
    
    try {
      const formatter = new Intl.DateTimeFormat('en-US', options)
      return formatter.format(now)
    } catch (error) {
      console.error('Error formatting time:', error)
      return '--:--'
    }
  }

  // Update time immediately when timezone changes
  useEffect(() => {
    setTime(formatTime())
  }, [preferences?.dashboard.timezone])

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatTime())
    }, 60000)

    return () => clearInterval(interval)
  }, [preferences?.dashboard.timezone])

  if (!preferences?.dashboard.timezone) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="font-medium">{time}</span>
    </div>
  )
} 