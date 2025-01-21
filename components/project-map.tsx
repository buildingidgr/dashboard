import { useState, useEffect } from 'react'
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'
import { lightStyle, darkStyle, mapContainerStyle } from "@/constants/map-styles"
import { useTheme } from "next-themes"

interface Coordinates {
  lat: number
  lng: number
}

interface ProjectMapProps {
  coordinates: Coordinates
  className?: string
}

export function ProjectMap({ coordinates, className }: ProjectMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const { resolvedTheme } = useTheme()
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey
  })

  if (!isLoaded) {
    return <div className={`w-full h-[200px] bg-muted animate-pulse ${className}`} />
  }

  const customMapContainerStyle = {
    ...mapContainerStyle,
    height: '200px',  // Override height for card context
  }

  return (
    <div className={`w-full h-[250px] overflow-hidden rounded-lg ${className}`}>
      <GoogleMap
        mapContainerStyle={customMapContainerStyle}
        zoom={12}
        center={coordinates}
        options={{
          styles: resolvedTheme === 'dark' ? darkStyle : lightStyle,
          disableDefaultUI: true,
          zoomControl: false,
          scrollwheel: false,
          gestureHandling: 'none'
        }}
      >
        <Marker position={coordinates} />
      </GoogleMap>
    </div>
  )
} 