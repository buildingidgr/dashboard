'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { useLoadScript } from '@react-google-maps/api'
import { GOOGLE_MAPS_LIBRARIES } from '@/lib/google-maps'

interface LocationValue {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface LocationInputProps {
  value: LocationValue;
  onChange: (location: LocationValue) => void;
  disabled?: boolean;
}

export default function LocationInput({ value, onChange, disabled }: LocationInputProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES
  })

  const [inputValue, setInputValue] = useState(value?.address || '')
  const mapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(value?.address || '')
  }, [value?.address])

  const initializeMap = useCallback((initialLocation: { lat: number; lng: number }) => {
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
          setInputValue(place.formatted_address || '')
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
            setInputValue(results[0].formatted_address)
            onChange(location)
          }
        })
      }
    })
  }, [isLoaded, onChange])

  useEffect(() => {
    if (!isLoaded) return;

    if (value?.coordinates && value?.address) {
      initializeMap(value.coordinates);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            initializeMap({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => {
            initializeMap({ lat: 37.9838, lng: 23.7275 });
          }
        );
      } else {
        initializeMap({ lat: 37.9838, lng: 23.7275 });
      }
    }
  }, [isLoaded, value, initializeMap]);

  if (loadError) {
    return <div>Error loading maps</div>
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>
  }

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Enter a location"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={disabled}
      />
      <div 
        ref={mapRef} 
        className="w-full h-[500px] rounded-md border border-input bg-background"
      />
    </div>
  )
} 