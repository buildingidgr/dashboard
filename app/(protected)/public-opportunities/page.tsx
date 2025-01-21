"use client"

import { useEffect, useState } from "react"
import { usePageTitle } from "@/components/layouts/client-layout"
import { PublicProjectsTable } from "@/components/public-projects-table"
import { GreeceOpportunitiesMap } from "@/components/maps/greece-opportunities-map"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"
import { useTheme } from "@/components/layouts/client-layout"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"

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

type ProjectType = typeof projectTypes[number];

export default function PublicOpportunitiesPage() {
  const { isDarkMode } = useTheme()
  const { setTitle, setDescription } = usePageTitle()
  const [selectedType, setSelectedType] = useState<string>("all")

  useEffect(() => {
    setTitle("Public Opportunities")
    setDescription("Discover available opportunities across Greece")
  }, [setTitle, setDescription])

  return (
    <div className="space-y-6">
      {/* Project Type Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Filter by Project Type:</span>
          <Select
            value={selectedType}
            onValueChange={setSelectedType}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projectTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Map */}
      <div className="h-[calc(100vh-12rem)]">
        <GoogleMapsProvider>
          <GreeceOpportunitiesMap isDarkMode={isDarkMode} projectTypeFilter={selectedType} />
        </GoogleMapsProvider>
      </div>
    </div>
  )
}
