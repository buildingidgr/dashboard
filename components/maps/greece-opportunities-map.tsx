"use client"

import { ArrowRight, Clock } from "lucide-react"
import Link from "next/link"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { MapLegend } from './map-legend'
import { defaultCenter } from '@/constants/map-styles'
import { OpportunityLocationMap } from './opportunity-location-map'
import { useLoadScript } from '@react-google-maps/api'
import { useOpportunities } from '@/hooks/use-opportunities'
import { useState } from 'react'
import { GOOGLE_MAPS_LIBRARIES } from '@/lib/google-maps'

interface GreeceOpportunitiesMapProps {
  isDarkMode: boolean
  projectTypeFilter?: string
}

export function GreeceOpportunitiesMap({ isDarkMode, projectTypeFilter = "all" }: GreeceOpportunitiesMapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  const { projects } = useOpportunities({
    page: 1,
    limit: 50
  })

  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const filteredProjects = projectTypeFilter === "all" 
    ? projects 
    : projects.filter(p => p.data.projectType === projectTypeFilter)

  const mapPoints = filteredProjects.map(project => ({
    id: project.data.id,
    coordinates: project.data.project.location.coordinates,
    category: {
      title: project.data.projectType,
      description: project.data.project.category.description
    },
    address: project.data.project.location.address
  }))

  const handleMarkerClick = (pointId: string) => {
    const project = filteredProjects.find(p => p.data.id === pointId)
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
            coordinates={defaultCenter}
            center={defaultCenter}
            zoom={6}
            points={mapPoints}
            isDarkMode={isDarkMode}
            onMarkerClick={handleMarkerClick}
          />
          <MapLegend />

          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerContent>
              {selectedProject && (
                <>
                  <DrawerHeader>
                    <DrawerTitle>{selectedProject.data.project.category.title}</DrawerTitle>
                    <DrawerDescription className="line-clamp-2">{selectedProject.data.project.details.description}</DrawerDescription>
                  </DrawerHeader>

                  <div className="px-4 py-3 space-y-4">
                    {/* Posted Date */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="p-2 bg-secondary rounded-md">
                        <Clock className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">Posted</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(selectedProject.data.metadata.submittedAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <DrawerFooter>
                    <Link href={`/opportunities/${selectedProject._id}`}>
                      <Button className="w-full gap-2">
                        View Details
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DrawerClose asChild>
                      <Button variant="outline">Close</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </>
              )}
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-gray-500 dark:text-gray-400">Loading map...</div>
        </div>
      )}
    </div>
  )
} 