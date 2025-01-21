"use client"

import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'
import { lightStyle, darkStyle } from '@/constants/map-styles'
import { categoryColors } from '@/constants/map-categories'

interface MapPoint {
  id: string
  coordinates: {
    lat: number
    lng: number
  }
  category: {
    title: string
    description: string
  }
  address: string
}

interface OpportunityLocationMapProps {
  coordinates: {
    lat: number
    lng: number
  }
  center?: {
    lat: number
    lng: number
  }
  zoom?: number
  points?: MapPoint[]
  isDarkMode?: boolean
  onMarkerClick?: (pointId: string) => void
}

// Circle path for marker (constant value equivalent to google.maps.SymbolPath.CIRCLE)
const CIRCLE_PATH = 'M -1 0 A 1 1 0 1 0 1 0 A 1 1 0 1 0 -1 0'

export function OpportunityLocationMap({ 
  coordinates,
  center = { lat: 39.0742, lng: 21.8243 },
  zoom = 15, 
  points = [], 
  isDarkMode = false, 
  onMarkerClick = () => {} 
}: OpportunityLocationMapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  if (!isLoaded) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
    </div>
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={coordinates || center}
      zoom={zoom}
      options={{
        styles: isDarkMode ? darkStyle : lightStyle,
        disableDefaultUI: true,
        zoomControl: false,
        scrollwheel: false,
        gestureHandling: 'none'
      }}
    >
      {points?.length > 0 ? (
        points.map((point) => (
          <Marker
            key={point.id}
            position={point.coordinates}
            title={point.category.title}
            onClick={() => onMarkerClick(point.id)}
            icon={{
              path: CIRCLE_PATH,
              scale: 8,
              fillColor: categoryColors[point.category.title] || '#666',
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: '#fff',
            }}
          />
        ))
      ) : (
        <Marker
          position={coordinates}
          icon={{
            path: CIRCLE_PATH,
            scale: 8,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#fff',
          }}
        />
      )}
    </GoogleMap>
  )
} 