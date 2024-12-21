'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card } from "@/components/ui/card"

interface LocationInputProps {
  value: any
  onChange: (location: { address: string; coordinates: { lat: number; lng: number } }) => void
}

export default function LocationInput({ value, onChange }: LocationInputProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initializeMap = (initialLocation: { lat: number; lng: number }) => {
    if (!mapRef.current || !isLoaded) return

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: initialLocation,
      zoom: 17,
      mapTypeControl: false,
      streetViewControl: false,
    })

    const markerInstance = new google.maps.Marker({
      map: mapInstance,
      position: initialLocation,
      draggable: true,
    })

    setMap(mapInstance)
    setMarker(markerInstance)

    if (inputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current)
      autocomplete.bindTo('bounds', mapInstance)

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.geometry?.location) {
          const location = {
            address: place.formatted_address || '',
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
          }
          onChange(location)
          mapInstance.setCenter(place.geometry.location)
          markerInstance.setPosition(place.geometry.location)
        }
      })
    }

    markerInstance.addListener('dragend', () => {
      const position = markerInstance.getPosition()
      if (position) {
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ location: position }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const location = {
              address: results[0].formatted_address,
              coordinates: {
                lat: position.lat(),
                lng: position.lng(),
              },
            }
            onChange(location)
            if (inputRef.current) {
              inputRef.current.value = results[0].formatted_address
            }
          }
        })
      }
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!googleApiKey) {
      console.error('Google Maps API key is missing')
      return
    }

    if (window.google?.maps) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return;

    // Only initialize with stored value or get browser location if no value exists
    if (value?.coordinates && value?.address) {
      initializeMap(value.coordinates);
      if (inputRef.current) {
        inputRef.current.value = value.address;
      }
    } else {
      // Get user's location only if no stored value exists
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            initializeMap({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => {
            // Fall back to default location (Athens)
            initializeMap({ lat: 37.9838, lng: 23.7275 });
          }
        );
      } else {
        initializeMap({ lat: 37.9838, lng: 23.7275 });
      }
    }
  }, [isLoaded, value]);

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Enter a location"
        defaultValue={value?.address || ''}
      />
      <div 
        ref={mapRef} 
        className="w-full h-[500px] rounded-md border border-input bg-background"
      />
    </div>
  )
} 