"use client"

import { useTheme } from "@/components/layouts/client-layout"
import { lightStyle, darkStyle } from "@/constants/map-styles"
import Image from 'next/image'

interface ProjectMapProps {
  coordinates: {
    lat: number
    lng: number
  }
}

export function ProjectMap({ coordinates }: ProjectMapProps) {
  const { isDarkMode } = useTheme()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Define map styles based on theme
  const mapStyle = isDarkMode ? darkStyle : lightStyle
  const styleParam = mapStyle.map(style => {
    const params = []
    if (style.featureType) params.push(`feature:${style.featureType}`)
    if (style.elementType) params.push(`element:${style.elementType}`)
    if (style.stylers) {
      style.stylers.forEach(styler => {
        const [key, value] = Object.entries(styler)[0]
        params.push(`${key}:${value}`)
      })
    }
    return `style=${params.join('|')}`
  }).join('&')

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden">
      <Image
        src={`https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=15&size=600x400&scale=2&markers=color:red%7C${coordinates.lat},${coordinates.lng}&key=${apiKey}&${styleParam}`}
        alt="Location map"
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  )
} 