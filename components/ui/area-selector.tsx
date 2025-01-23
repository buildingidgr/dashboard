'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
      circle.setMap(map) // Ensure circle is attached to map
    }
  }, [circle, map])

  const debouncedOnChange = useCallback(
    (location: Parameters<typeof onChange>[0]) => {
      const updateKey = JSON.stringify(location)
      if (updateKey === lastUpdateRef.current) return
      lastUpdateRef.current = updateKey
      isUserInteractionRef.current = false
      onChange(location)
    },
    [onChange]
  )

  const debouncedOnChangeWithDebounce = useMemo(
    () => debounce(debouncedOnChange, 1000),
    [debouncedOnChange]
  )

  useEffect(() => {
    return () => {
      debouncedOnChangeWithDebounce.cancel()
    }
  }, [debouncedOnChangeWithDebounce])

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
  }, [value?.address, value?.radius, maxRadius, circle, value])

  // Calculate appropriate zoom level based on radius
  const getZoomForRadius = useCallback((radiusInKm: number) => {
    // This is an approximation. Adjust these values based on your needs
    const radiusToZoomMap = [
      { radius: 5, zoom: 12 },
      { radius: 10, zoom: 11 },
      { radius: 20, zoom: 10 },
      { radius: 50, zoom: 9 },
      { radius: 100, zoom: 8 },
    ]
    
    for (const { radius, zoom } of radiusToZoomMap) {
      if (radiusInKm <= radius) return zoom
    }
    return 8 // Default zoom for large radius
  }, [])

  // Update map zoom to fit radius
  const adjustMapZoom = useCallback((center: google.maps.LatLng, radiusInKm: number) => {
    if (!map) return
    
    const zoom = getZoomForRadius(radiusInKm)
    map.setZoom(zoom)
    map.setCenter(center)
  }, [map, getZoomForRadius])

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
        debouncedOnChangeWithDebounce(location)
      }
    })

    return () => {
      google.maps.event.removeListener(listener)
    }
  }, [isLoaded, map, marker, circle, radius, debouncedOnChangeWithDebounce, updateCircle])

  // Initialize map elements when loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || isInitializedRef.current) return;

    const initialRadius = value?.radius || DEFAULT_RADIUS
    const initialCenter = value?.coordinates || { lat: 0, lng: 0 }
    const initialZoom = getZoomForRadius(initialRadius)

    const mapInstance = new google.maps.Map(mapRef.current, {
      zoom: initialZoom,
      center: initialCenter,
      disableDefaultUI: true,
      zoomControl: true,
      draggable: false,
      scrollwheel: false
    })

    const markerInstance = new google.maps.Marker({
      map: mapInstance,
      position: initialCenter,
      draggable: false
    })

    const circleInstance = new google.maps.Circle({
      map: mapInstance,
      center: initialCenter,
      radius: initialRadius * 1000,
      editable: false, // Prevent radius editing on map
      draggable: false,
      fillColor: '#1d4ed8',
      fillOpacity: 0.2,
      strokeColor: '#1d4ed8',
      strokeWeight: 2,
      visible: true
    })

    setMap(mapInstance)
    setMarker(markerInstance)
    setCircle(circleInstance)
    isInitializedRef.current = true

    return () => {
      markerInstance.setMap(null)
      circleInstance.setMap(null)
    }
  }, [isLoaded, disabled, value?.coordinates, value?.radius, getZoomForRadius])

  // Update map elements when value changes externally
  useEffect(() => {
    if (!map || !marker || !circle || !value?.coordinates || isUserInteractionRef.current) return;

    const newPosition = new google.maps.LatLng(
      value.coordinates.lat,
      value.coordinates.lng
    )

    const newRadius = value.radius || DEFAULT_RADIUS
    
    marker.setPosition(newPosition)
    circle.setCenter(newPosition)
    circle.setRadius(newRadius * 1000)
    circle.setMap(map)
    
    // Adjust zoom and center when values change externally
    adjustMapZoom(newPosition, newRadius)
  }, [map, marker, circle, value?.coordinates?.lat, value?.coordinates?.lng, value?.radius, adjustMapZoom])

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
          onValueChange={([newRadius]) => {
            isUserInteractionRef.current = true;
            const clampedRadius = Math.min(newRadius, maxRadius)
            setRadius(clampedRadius)
            const center = marker?.getPosition()
            if (center && circle) {
              updateCircle(center, clampedRadius)
              // Trigger onChange with current values
              debouncedOnChangeWithDebounce({
                address: inputValue,
                coordinates: {
                  lat: center.lat(),
                  lng: center.lng()
                },
                radius: clampedRadius
              })
            }
          }}
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