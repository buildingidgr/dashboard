"use client"

import { useLoadScript } from '@react-google-maps/api'
import { GOOGLE_MAPS_LIBRARIES } from '@/lib/google-maps'
import { createContext, useContext, ReactNode } from 'react'

interface GoogleMapsContextType {
  isLoaded: boolean
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({ isLoaded: false })

export const useGoogleMaps = () => useContext(GoogleMapsContext)

interface GoogleMapsProviderProps {
  children: ReactNode
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES
  })

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsContext.Provider>
  )
} 