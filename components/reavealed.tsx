"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Globe, Lock, User } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface ProjectData {
  id: string
  title: string
  description: string
  type: string
  state: 'public' | 'private'
  location: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
}

interface RevealedProps {
  projectId: string
}

export default function Revealed({ projectId }: RevealedProps) {
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // Empty body for PUT request
        })
        if (!response.ok) {
          throw new Error('Failed to fetch project data')
        }
        const data: ProjectData = await response.json()
        setProjectData(data)
        setIsLoading(false)
      } catch (err) {
        setError('Error fetching project data')
        setIsLoading(false)
      }
    }

    fetchProjectData()
  }, [projectId])

  const calculateBoundingBox = (lat: number, lng: number, distance: number = 3) => {
    const earthRadius = 6371
    const latDelta = (distance / earthRadius) * (180 / Math.PI)
    const lngDelta = (distance / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180)

    return {
      north: lat + latDelta,
      south: lat - latDelta,
      east: lng + lngDelta,
      west: lng - lngDelta
    }
  }

  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!projectData) return <div>No project data available</div>

  const boundingBox = calculateBoundingBox(projectData.location.coordinates.lat, projectData.location.coordinates.lng)

  return (
    <Card className="w-full max-w-2xl mx-auto flex flex-col h-full">
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex flex-col flex-grow">
        <div className="flex items-start gap-2 sm:gap-3">
          <MapPin className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0 text-gray-500" />
          <p className="text-sm">
            {projectData.location.address}
          </p>
        </div>
        <div className="space-y-2 sm:space-y-4 mb-4">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold leading-tight">
              {projectData.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={projectData.state === 'public' ? 'default' : 'secondary'} className="text-xs py-1 px-2">
                {projectData.state === 'public' ? <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> : <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                {projectData.state.charAt(0).toUpperCase() + projectData.state.slice(1)}
              </Badge>
              <Badge variant="outline" className="text-xs py-1 px-2">
                {projectData.type}
              </Badge>
            </div>
          </div>
        </div>
        <div className="relative w-full h-[200px] sm:h-[300px] rounded-lg overflow-hidden mb-2 sm:mb-4">
          <img
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${projectData.location.coordinates.lat},${projectData.location.coordinates.lng}&zoom=13&size=300x300&path=color:0x00000000|weight:5|fillcolor:0xFFFF0033|${boundingBox.north},${boundingBox.west}|${boundingBox.north},${boundingBox.east}|${boundingBox.south},${boundingBox.east}|${boundingBox.south},${boundingBox.west}|${boundingBox.north},${boundingBox.west}&key=${googleApiKey}`}
            alt="Project location map"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <p className="text-text-base text-gray-500 mb-4">
          {projectData.description}
        </p>
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer Information
          </h4>
          <p>Name: {projectData.customer.first_name} {projectData.customer.last_name}</p>
          <p>Email: {projectData.customer.email}</p>
          <p>Phone: {projectData.customer.phone}</p>
        </div>
      </CardContent>
    </Card>
  )
}

