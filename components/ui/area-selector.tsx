'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { debounce } from 'lodash'
import { useGoogleMaps } from '@/lib/contexts/google-maps-context'

interface AreaSelectorProps {
  value: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
    radius?: number
  }
  onChange: (location: { 
    address: string
    coordinates: { lat: number; lng: number }
    radius: number 
  }) => void
  disabled?: boolean
  maxRadius?: number
}

const DEFAULT_RADIUS = 50 // Default radius in kilometers

export default function AreaSelector({ 
  value, 
  onChange, 
  disabled = false,
  maxRadius = 100 // Maximum radius in kilometers
}: AreaSelectorProps) {
  const { isLoaded, loadError } = useGoogleMaps()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [circle, setCircle] = useState<google.maps.Circle | null>(null)
  const [inputValue, setInputValue] = useState(value?.address || '')
  const [radius, setRadius] = useState(value?.radius || DEFAULT_RADIUS)
  const mapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isInitializedRef = useRef(false)
  const isUserInteractionRef = useRef(false)
  const lastUpdateRef = useRef<string>('')

  const updateCircle = useCallback((center: google.maps.LatLng, newRadius: number) => {
    if (circle) {
      circle.setCenter(center)
      circle.setRadius(newRadius * 1000) // Convert km to meters
    }
  }, [circle])

  // Debounced onChange handler for address/location changes
  const debouncedOnChange = useCallback(
    debounce((location: Parameters<typeof onChange>[0]) => {
      // Create a unique key for this update
      const updateKey = JSON.stringify(location)
      
      // Skip if this exact update was just made
      if (updateKey === lastUpdateRef.current) {
        return
      }
      
      lastUpdateRef.current = updateKey
      isUserInteractionRef.current = false
      onChange(location)
    }, 1000),
    [onChange]
  )

  // Update local state when value changes externally
  useEffect(() => {
    if (isUserInteractionRef.current) return;
    
    if (value?.address) {
      setInputValue(value.address)
    }
    if (typeof value?.radius === 'number') {
      const newRadius = Math.min(value.radius, maxRadius)
      setRadius(newRadius)
      if (circle) {
        circle.setRadius(newRadius * 1000)
      }
    }
  }, [value?.address, value?.radius, maxRadius, circle])

  // Initialize autocomplete separately from map
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry'],
      types: ['geocode']
    })

    if (map) {
      autocomplete.bindTo('bounds', map)
    }

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        const location = {
          address: place.formatted_address || '',
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
          radius
        }
        setInputValue(place.formatted_address || '')
        if (map && marker && circle) {
          map.setCenter(place.geometry.location)
          marker.setPosition(place.geometry.location)
          updateCircle(place.geometry.location, radius)
        }
        debouncedOnChange(location)
      }
    })

    return () => {
      google.maps.event.removeListener(listener)
    }
  }, [isLoaded, map, marker, circle, radius, debouncedOnChange, updateCircle])

  const handleRadiusChange = useCallback(([newRadius]: number[]) => {
    isUserInteractionRef.current = true;
    const clampedRadius = Math.min(newRadius, maxRadius)
    setRadius(clampedRadius)
    const center = marker?.getPosition()
    if (center && circle) {
      updateCircle(center, clampedRadius)
      
      // Use debounced onChange for radius changes
      debouncedOnChange({
        address: inputValue,
        coordinates: {
          lat: center.lat(),
          lng: center.lng(),
        },
        radius: clampedRadius
      })
    }
  }, [marker, circle, inputValue, debouncedOnChange, maxRadius, updateCircle])

  const setupMapListeners = useCallback((
    mapInstance: google.maps.Map,
    markerInstance: google.maps.Marker,
    circleInstance: google.maps.Circle,
    autocomplete: google.maps.places.Autocomplete
  ) => {
    autocomplete.addListener('place_changed', () => {
      isUserInteractionRef.current = true;
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        const location = {
          address: place.formatted_address || '',
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
          radius
        }
        setInputValue(place.formatted_address || '')
        debouncedOnChange(location)
        mapInstance.setCenter(place.geometry.location)
        markerInstance.setPosition(place.geometry.location)
        updateCircle(place.geometry.location, radius)
      }
    })

    let dragEndTimeout: NodeJS.Timeout;
    markerInstance.addListener('dragend', () => {
      isUserInteractionRef.current = true;
      const position = markerInstance.getPosition()
      if (position) {
        clearTimeout(dragEndTimeout)
        dragEndTimeout = setTimeout(() => {
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              const location = {
                address: results[0].formatted_address,
                coordinates: {
                  lat: position.lat(),
                  lng: position.lng(),
                },
                radius
              }
              setInputValue(results[0].formatted_address)
              debouncedOnChange(location)
              updateCircle(position, radius)
            }
          })
        }, 500)
      }
    })

    let radiusChangeTimeout: NodeJS.Timeout;
    circleInstance.addListener('radius_changed', () => {
      isUserInteractionRef.current = true;
      clearTimeout(radiusChangeTimeout)
      radiusChangeTimeout = setTimeout(() => {
        const newRadius = Math.min(
          Math.round(circleInstance.getRadius() / 1000),
          maxRadius
        )
        setRadius(newRadius)
        const center = circleInstance.getCenter()
        if (center) {
          debouncedOnChange({
            address: inputValue,
            coordinates: {
              lat: center.lat(),
              lng: center.lng(),
            },
            radius: newRadius
          })
        }
      }, 500)
    })

    let centerChangeTimeout: NodeJS.Timeout;
    circleInstance.addListener('center_changed', () => {
      isUserInteractionRef.current = true;
      clearTimeout(centerChangeTimeout)
      centerChangeTimeout = setTimeout(() => {
        const center = circleInstance.getCenter()
        if (center) {
          markerInstance.setPosition(center)
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: center }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              debouncedOnChange({
                address: results[0].formatted_address,
                coordinates: {
                  lat: center.lat(),
                  lng: center.lng(),
                },
                radius
              })
              setInputValue(results[0].formatted_address)
            }
          })
        }
      }, 500)
    })
  }, [radius, debouncedOnChange, updateCircle, maxRadius])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || isInitializedRef.current) return;

    const initialLocation = value?.coordinates && value?.address
      ? value.coordinates
      : { lat: 37.9838, lng: 23.7275 }; // Default to Greece

    const initialRadius = Math.min(value?.radius || DEFAULT_RADIUS, maxRadius)

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: initialLocation,
      zoom: 8,
      mapTypeControl: false,
      streetViewControl: false,
    })

    const markerInstance = new google.maps.Marker({
      map: mapInstance,
      position: initialLocation,
      draggable: !disabled,
    })

    const circleInstance = new google.maps.Circle({
      map: mapInstance,
      center: initialLocation,
      radius: initialRadius * 1000, // Convert km to meters
      fillColor: '#3B82F6',
      fillOpacity: 0.2,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      editable: !disabled,
      draggable: !disabled
    })

    if (inputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current)
      autocomplete.bindTo('bounds', mapInstance)
      setupMapListeners(mapInstance, markerInstance, circleInstance, autocomplete)
    }

    setMap(mapInstance)
    setMarker(markerInstance)
    setCircle(circleInstance)
    isInitializedRef.current = true

    return () => {
      markerInstance.setMap(null)
      circleInstance.setMap(null)
      isInitializedRef.current = false
    }
  }, [isLoaded])

  // Update map elements when value changes externally
  useEffect(() => {
    if (!map || !marker || !circle || !value?.coordinates) return;

    const newPosition = new google.maps.LatLng(
      value.coordinates.lat,
      value.coordinates.lng
    )

    marker.setPosition(newPosition)
    circle.setCenter(newPosition)
    if (typeof value.radius === 'number') {
      circle.setRadius(value.radius * 1000)
    }
    map.setCenter(newPosition)
  }, [value?.coordinates?.lat, value?.coordinates?.lng, value?.radius])

  if (loadError) {
    return <div>Error loading maps</div>
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for a location"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={disabled}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label>Area Radius</Label>
          <span className="text-sm text-muted-foreground">{radius} km</span>
        </div>
        <Slider
          value={[radius]}
          onValueChange={handleRadiusChange}
          max={maxRadius}
          min={1}
          step={1}
          disabled={disabled}
        />
      </div>
      <div 
        ref={mapRef} 
        className="w-full h-[400px] rounded-md border border-input bg-background"
      />
    </div>
  )
} 