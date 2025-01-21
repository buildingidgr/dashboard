"use client";

import { GreeceOpportunitiesMap } from "@/components/maps/greece-opportunities-map"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"
import { useTheme, usePageTitle } from "@/components/layouts/client-layout"
import { useEffect } from "react"

export default function OpportunitiesPage() {
  const { isDarkMode } = useTheme()
  const { setTitle, setDescription } = usePageTitle()

  useEffect(() => {
    setTitle("Opportunities")
    setDescription("View and manage opportunities across Greece")
  }, [setTitle, setDescription])

  return (
    <div className="space-y-6">
      <GoogleMapsProvider>
        <GreeceOpportunitiesMap isDarkMode={isDarkMode} />
      </GoogleMapsProvider>
    </div>
  )
} 