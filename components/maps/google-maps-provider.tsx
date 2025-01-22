import React, { ReactNode } from 'react'
import { useLoadScript } from '@react-google-maps/api'

interface GoogleMapsProviderProps {
  children: ReactNode
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  })

  if (loadError) {
    return <div>Error loading Google Maps</div>
  }

  if (!isLoaded) {
    return <div>Loading Maps...</div>
  }

  return <>{children}</>
} 