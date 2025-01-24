"use client"

import { useEffect, useState } from "react"
import { usePageTitle } from "@/components/layouts/client-layout"
import { GreeceOpportunitiesMap } from "@/components/maps/greece-opportunities-map"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"
import { useTheme } from "@/components/layouts/client-layout"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOpportunities, type Opportunity } from "@/hooks/use-opportunities"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ProjectTypesLegend } from "@/components/opportunities/project-types-legend"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { MechBadge } from "@/components/ui/mech-badge"
import { Clock, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { categoryColors, simplifiedLabels } from "@/constants/map-categories"

const projectTypes = [
  "Αρχιτεκτονικός Σχεδιασμός",
  "Στατικές & Κατασκευαστικές Μελέτες",
  "Τεχνικοί Έλεγχοι & Νομιμοποιήσεις",
  "Τεχνικά Έργα & Υποδομές",
  "Ηλεκτρομηχανολογικές Εγκαταστάσεις",
  "Ενεργειακές Υπηρεσίες",
  "Συστήματα Ασφαλείας",
  "Δίκτυα & Επικοινωνίες"
] as const;

export default function PublicOpportunitiesPage() {
  const { isDarkMode } = useTheme()
  const { setTitle, setDescription } = usePageTitle()
  const [selectedType, setSelectedType] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [searchQuery, setSearchQuery] = useState("")
  const [radiusKm, setRadiusKm] = useState<number>(10)

  const { projects } = useOpportunities({
    page: 1,
    limit: 50
  })

  const totalCount = projects.length

  useEffect(() => {
    setTitle("Public Opportunities")
    setDescription("Discover available opportunities across Greece")
  }, [setTitle, setDescription])

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Opportunities</h3>
          <p className="text-2xl font-bold">{totalCount}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">New This Week</h3>
          <p className="text-2xl font-bold">{projects.filter((p: Opportunity) => {
            const submittedAt = p.metadata?.submittedAt || p.data.metadata?.submittedAt
            return submittedAt && new Date(submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }).length}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Active Areas</h3>
          <p className="text-2xl font-bold">{new Set(projects.map((p: Opportunity) => p.data.project.location.address)).size}</p>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card className="space-y-4 border-none">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1 w-full md:w-auto">
            <Input
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-[200px] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Radius</span>
              <span className="text-sm font-medium">{radiusKm} km</span>
            </div>
            <Slider
              value={[radiusKm]}
              onValueChange={(value) => setRadiusKm(value[0])}
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "map" | "list")} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Project Types Legend */}
      <ProjectTypesLegend 
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />

      {/* Content */}
      {viewMode === "map" ? (
        <div className="h-[600px]">
          <GoogleMapsProvider>
            <GreeceOpportunitiesMap 
              isDarkMode={isDarkMode} 
              projectTypeFilter={selectedType}
              searchRadius={radiusKm}
              searchQuery={searchQuery}
            />
          </GoogleMapsProvider>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects
            .filter((p: Opportunity) => 
              (selectedType === "all" || p.data.project.category === selectedType) &&
              (searchQuery === "" || 
                p.data.project.details.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.data.project.location.address.toLowerCase().includes(searchQuery.toLowerCase())
              )
            )
            .map((project: Opportunity) => (
              <Card 
                key={project._id} 
                className="flex flex-col"
              >
                <div className="p-6 flex-1 space-y-4">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <MechBadge dotColor={categoryColors[project.data.project.category]}>
                        {simplifiedLabels[project.data.project.category]}
                      </MechBadge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(project.metadata?.submittedAt || project.data.metadata?.submittedAt || new Date()), 'PP')}
                      </div>
                    </div>
                    <h3 className="font-semibold">{project.data.project.details.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.data.project.details.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                  <Link href={`/opportunities/${project._id}`} className="w-full">
                    <Button className="w-full gap-2" variant="outline">
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
