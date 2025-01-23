"use client"

import { GoogleMap, Marker } from '@react-google-maps/api'
import { lightStyle, darkStyle } from '@/constants/map-styles'
import { categoryColors } from '@/constants/map-categories'
import { useEffect, useRef } from 'react'
import { useGoogleMaps } from './google-maps-provider'

// Custom SVG paths for markers
const BUILDING_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
const CIRCLE_PATH = 'M -1 0 A 1 1 0 1 0 1 0 A 1 1 0 1 0 -1 0'

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
  isUserLocation?: boolean
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
  showRadius?: boolean
  radiusInKm?: number
}

// Get zoom level based on radius ranges
const getZoomForRadius = (radiusInKm: number): number => {
  if (radiusInKm <= 5) return 14
  if (radiusInKm <= 10) return 13
  if (radiusInKm <= 25) return 11
  if (radiusInKm <= 50) return 10
  if (radiusInKm <= 75) return 9
  return 8 // for radius > 75km
}

export function OpportunityLocationMap({ 
  coordinates,
  center = { lat: 39.0742, lng: 21.8243 },
  zoom = 17, // Increased default zoom level
  points = [], 
  isDarkMode = false, 
  onMarkerClick = () => {},
  showRadius = false,
  radiusInKm = 10 // Default to 10km
}: OpportunityLocationMapProps) {
  const { isLoaded } = useGoogleMaps()
  const mapRef = useRef<google.maps.Map | null>(null)
  const circleRef = useRef<google.maps.Circle | null>(null)

  // Effect to create and manage circle
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    // Create circle if it doesn't exist
    if (!circleRef.current) {
      const userPoint = points.find(p => p.isUserLocation)
      if (userPoint && showRadius) {
        console.log('Creating circle with radius:', radiusInKm * 1000)
        circleRef.current = new google.maps.Circle({
          map: mapRef.current,
          center: userPoint.coordinates,
          radius: radiusInKm * 1000,
          fillColor: '#4F46E5',
          fillOpacity: 0.1,
          strokeColor: '#4F46E5',
          strokeOpacity: 0.8,
          strokeWeight: 2,
        })
        
        // Set initial zoom based on radius
        const newZoom = getZoomForRadius(radiusInKm)
        mapRef.current.setZoom(newZoom)
        mapRef.current.setCenter(userPoint.coordinates)
      }
    } else {
      // Update existing circle
      const userPoint = points.find(p => p.isUserLocation)
      if (userPoint && showRadius) {
        console.log('Updating circle radius to:', radiusInKm * 1000)
        circleRef.current.setRadius(radiusInKm * 1000)
        circleRef.current.setCenter(userPoint.coordinates)
        circleRef.current.setMap(mapRef.current)

        // Update zoom based on radius
        const newZoom = getZoomForRadius(radiusInKm)
        mapRef.current.setZoom(newZoom)
        mapRef.current.setCenter(userPoint.coordinates)
      } else {
        // Remove circle if showRadius is false or no user location
        circleRef.current.setMap(null)
      }
    }

    // Cleanup function
    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null)
        circleRef.current = null
      }
    }
  }, [isLoaded, mapRef.current, points, showRadius, radiusInKm])

  const onMapLoad = (map: google.maps.Map) => {
    console.log('Map loaded')
    mapRef.current = map
  }

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
      onLoad={onMapLoad}
      options={{
        styles: isDarkMode ? darkStyle : lightStyle,
        disableDefaultUI: true,
        zoomControl: true,
        scrollwheel: true,
        gestureHandling: 'cooperative',
        maxZoom: 19, // Added maximum zoom level
        minZoom: 6   // Added minimum zoom level
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
              path: point.isUserLocation ? CIRCLE_PATH : BUILDING_PATH,
              scale: point.isUserLocation ? 10 : 1.5,
              fillColor: point.isUserLocation ? '#4F46E5' : (categoryColors[point.category.title] || '#666'),
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#fff',
              anchor: point.isUserLocation ? undefined : new google.maps.Point(12, 22)
            }}
          />
        ))
      ) : (
        <Marker
          position={coordinates}
          icon={{
            path: BUILDING_PATH,
            scale: 1.5,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#fff',
            anchor: new google.maps.Point(12, 22)
          }}
        />
      )}
    </GoogleMap>
  )
} 