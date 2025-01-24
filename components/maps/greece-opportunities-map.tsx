"use client"

import { ArrowRight, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { defaultCenter } from '@/constants/map-styles'
import { OpportunityLocationMap } from './opportunity-location-map'
import { useLoadScript } from '@react-google-maps/api'
import { useOpportunities } from '@/hooks/use-opportunities'
import { useState } from 'react'
import { GOOGLE_MAPS_LIBRARIES } from '@/lib/google-maps'
import { useProfessionalInfo } from "@/hooks/use-professional-info"
import { MechDialog } from "@/components/ui/mech-dialog"
import { MechBadge } from "@/components/ui/mech-badge"
import { categoryColors } from "@/constants/map-categories"

interface GreeceOpportunitiesMapProps {
  isDarkMode: boolean
  projectTypeFilter?: string
  searchQuery?: string
  searchRadius?: number
}

export function GreeceOpportunitiesMap({ 
  isDarkMode, 
  projectTypeFilter = "all",
  searchQuery = "",
  searchRadius
}: GreeceOpportunitiesMapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  const { projects } = useOpportunities({
    page: 1,
    limit: 50
  })

  const { professionalInfo } = useProfessionalInfo()
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const calculateDistance = (
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number | null => {
    if (!window.google?.maps?.geometry?.spherical) {
      return null
    }

    try {
      return window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(point1),
        new window.google.maps.LatLng(point2)
      )
    } catch (error) {
      console.error('Error calculating distance:', error)
      return null
    }
  }

  const filteredProjects = projects
    .filter(project => {
      const matchesType = projectTypeFilter === "all" || project.data.project.category === projectTypeFilter
      const matchesSearch = !searchQuery || 
        project.data.project.details.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.data.project.location.address.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (!matchesType || !matchesSearch) return false

      if (searchRadius && professionalInfo?.areaOfOperation?.coordinates) {
        const distance = calculateDistance(
          {
            lat: professionalInfo.areaOfOperation.coordinates.latitude,
            lng: professionalInfo.areaOfOperation.coordinates.longitude
          },
          project.data.project.location.coordinates
        )
        return distance !== null ? distance <= searchRadius * 1000 : true // Convert km to meters
      }

      return true
    })

  const mapPoints = filteredProjects.map(project => ({
    id: project._id,
    coordinates: project.data.project.location.coordinates,
    category: {
      title: project.data.project.category,
      description: project.data.project.details.description
    },
    address: project.data.project.location.address
  }))

  // Add professional's location to the map points if available
  const allMapPoints = professionalInfo?.areaOfOperation?.coordinates
    ? [
        ...mapPoints,
        {
          id: 'professional-location',
          coordinates: {
            lat: professionalInfo.areaOfOperation.coordinates.latitude,
            lng: professionalInfo.areaOfOperation.coordinates.longitude
          },
          category: {
            title: 'Your Location',
            description: professionalInfo.areaOfOperation.address
          },
          address: professionalInfo.areaOfOperation.address,
          isUserLocation: true
        }
      ]
    : mapPoints

  const handleMarkerClick = (pointId: string) => {
    if (pointId === 'professional-location') return
    const project = projects.find(p => p._id === pointId)
    if (project) {
      setSelectedProject(project)
      setIsDrawerOpen(true)
    }
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 relative">
      {isLoaded ? (
        <>
          <OpportunityLocationMap
            coordinates={professionalInfo?.areaOfOperation?.coordinates 
              ? {
                  lat: professionalInfo.areaOfOperation.coordinates.latitude,
                  lng: professionalInfo.areaOfOperation.coordinates.longitude
                }
              : defaultCenter}
            center={defaultCenter}
            zoom={6}
            points={allMapPoints}
            isDarkMode={isDarkMode}
            onMarkerClick={handleMarkerClick}
            showRadius={searchRadius !== undefined}
            radiusInKm={searchRadius}
          />

          {selectedProject && (
            <MechDialog
              open={isDrawerOpen}
              onOpenChange={(open) => {
                setIsDrawerOpen(open)
                if (!open) {
                  setSelectedProject(null)
                }
              }}
              title={selectedProject.data.project.details.title}
              footer={
                <Link href={`/opportunities/${selectedProject._id}`} className="w-full">
                  <Button className="w-full gap-2">
                    View Details
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              }
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <MechBadge dotColor={categoryColors[selectedProject.data.project.category]}>
                    {selectedProject.data.project.category}
                  </MechBadge>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {selectedProject.data.project.details.description}
                  </p>
                </div>
              </div>
            </MechDialog>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
        </div>
      )}
    </div>
  )
} 