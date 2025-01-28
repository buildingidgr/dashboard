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
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { MechBadge } from "@/components/ui/mech-badge"
import { Clock, ArrowRight, Search, MapPin, Filter } from "lucide-react"
import { format } from "date-fns"
import { categoryColors, simplifiedLabels } from "@/constants/map-categories"
import { getAccessToken } from "@/lib/services/auth"
import { toast } from "@/components/ui/use-toast"
import { useSession } from "@clerk/nextjs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { calculateDistance } from "@/lib/utils"
import { useProfessionalInfo } from "@/hooks/use-professional-info"
import { useRouter } from "next/navigation"

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
  // Core hooks
  const { isDarkMode } = useTheme()
  const { setTitle, setDescription } = usePageTitle()
  const router = useRouter()
  const { isLoaded: isSessionLoaded } = useSession()
  const { professionalInfo, isLoading: isLoadingProfessionalInfo } = useProfessionalInfo()

  // All state hooks must be declared regardless of conditions
  const [selectedType, setSelectedType] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [searchQuery, setSearchQuery] = useState("")
  const [radiusKm, setRadiusKm] = useState<number>(30)
  const [maxRadius, setMaxRadius] = useState<number>(100)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isPromoting, setIsPromoting] = useState<string | null>(null)

  // Always fetch opportunities, but we'll only use them if profile is complete
  const { projects } = useOpportunities({
    page: 1,
    limit: 50
  })

  // Set page title
  useEffect(() => {
    setTitle("Public Opportunities")
    setDescription("Discover available opportunities across Greece")
  }, [setTitle, setDescription])

  // Handle professional info updates
  useEffect(() => {
    if (professionalInfo?.areaOfOperation) {
      const profileMaxRadius = professionalInfo.areaOfOperation.radius || 100
      setMaxRadius(profileMaxRadius)
      
      if (professionalInfo.areaOfOperation.coordinates) {
        setUserLocation({
          lat: professionalInfo.areaOfOperation.coordinates.latitude,
          lng: professionalInfo.areaOfOperation.coordinates.longitude
        })
      }
      
      // If current radius is larger than max, adjust it
      if (radiusKm > profileMaxRadius) {
        setRadiusKm(profileMaxRadius)
      }
    }
    setIsLoadingProfile(false)
  }, [professionalInfo, radiusKm])

  if (!isSessionLoaded) {
    return (
      <div className="space-y-6">
        {/* Statistics Overview Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-28" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="flex flex-col">
              <div className="p-6 flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-6 w-full" />
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="p-6 pt-0">
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const handlePromoteToProject = async (opportunityId: string) => {
    try {
      setIsPromoting(opportunityId)
      const token = getAccessToken()
      if (!token) throw new Error('No access token available')

      const response = await fetch(`/api/opportunities/${opportunityId}/promote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to promote opportunity')
      }

      toast({
        title: "Success!",
        description: "Opportunity has been promoted to a project.",
      })
      
      // Redirect to the projects page
      router.push('/projects')
    } catch (error) {
      console.error('Error promoting opportunity:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to promote opportunity",
        variant: "destructive",
      })
    } finally {
      setIsPromoting(null)
    }
  }

  // Check if professional info is properly set up
  const isProfessionalInfoComplete = professionalInfo && 
    professionalInfo.profession?.current &&
    professionalInfo.areaOfOperation?.coordinates?.latitude &&
    professionalInfo.areaOfOperation?.coordinates?.longitude &&
    professionalInfo.areaOfOperation?.radius

  // Calculate derived values only if we're going to use them
  const totalCount = isProfessionalInfoComplete ? projects.length : 0
  const activeOpportunitiesInArea = isProfessionalInfoComplete && userLocation ? 
    projects.filter((p: Opportunity) => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        p.data.project.location.coordinates.lat,
        p.data.project.location.coordinates.lng
      )
      return distance <= radiusKm
    }).length : 0

  // Render profile setup message if professional info is not complete
  if (!isLoadingProfessionalInfo && !isProfessionalInfoComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 bg-background border-none shadow-none">
        <Card className="max-w-2xl w-full p-8 border-none bg-transparent shadow-none">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="w-64 h-64 relative">
              <img
                src="/profile-setup-required.svg"
                alt="Profile setup required"
                className="w-full h-full"
              />
            </div>
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Complete Your Professional Profile</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                To access and interact with opportunities in your area, please complete your professional profile setup. Set your professional title. Define your base location. Specify your operational radius
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href="/profile">
                  Complete Profile Setup
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Render main content
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
          <h3 className="text-sm font-medium text-muted-foreground">Active opportunities in your area</h3>
          <p className="text-2xl font-bold">{activeOpportunitiesInArea}</p>
          {userLocation && (
            <p className="text-xs text-muted-foreground mt-1">Within {radiusKm}km of your location</p>
          )}
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setSelectedType("all")
                setRadiusKm(30)
              }}
            >
              Reset Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search by title or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Search in project titles and locations
              </p>
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {projectTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {simplifiedLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter by specific project category
              </p>
            </div>

            {/* Search Radius */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Radius</label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <Slider
                  value={[radiusKm]}
                  onValueChange={(value) => setRadiusKm(value[0])}
                  min={1}
                  max={maxRadius}
                  step={1}
                  className="flex-1"
                  disabled={isLoadingProfile}
                />
                <span className="text-sm font-medium min-w-[4rem] text-right">
                  {radiusKm} km
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Show opportunities within {radiusKm}km of your location (max {maxRadius}km)
              </p>
            </div>

            {/* View Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium">View Mode</label>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "map" | "list")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="map">Map View</TabsTrigger>
                  <TabsTrigger value="list">List View</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                Switch between map and list view
              </p>
            </div>
          </div>
        </div>
      </Card>

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
        <>
          {projects.filter((p: Opportunity) => {
            // Filter by project type and search query
            const matchesType = selectedType === "all" || p.data.project.category === selectedType
            const matchesSearch = searchQuery === "" || 
              p.data.project.details.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.data.project.location.address.toLowerCase().includes(searchQuery.toLowerCase())
            
            // Filter by distance if user location is available
            let withinRadius = true
            if (userLocation) {
              const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                p.data.project.location.coordinates.lat,
                p.data.project.location.coordinates.lng
              )
              withinRadius = distance <= radiusKm
            }
            
            return matchesType && matchesSearch && withinRadius
          }).length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-background p-8">
              <div className="w-60 h-60">
                <img
                  src="/empty-opportunities.svg"
                  alt="No opportunities"
                  className="w-full h-full"
                />
              </div>
              <div className="max-w-[420px] space-y-2 text-center">
                <h3 className="text-xl font-semibold">No opportunities found</h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery || selectedType !== "all" || radiusKm < maxRadius ? 
                    "Try adjusting your filters to see more opportunities." :
                    "There are currently no available opportunities. Check back later for new opportunities."}
                </p>
                {(searchQuery || selectedType !== "all" || radiusKm < maxRadius) && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedType("all")
                      setRadiusKm(30)
                    }}
                    className="mt-4"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects
                .filter((p: Opportunity) => {
                  // Filter by project type and search query
                  const matchesType = selectedType === "all" || p.data.project.category === selectedType
                  const matchesSearch = searchQuery === "" || 
                    p.data.project.details.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.data.project.location.address.toLowerCase().includes(searchQuery.toLowerCase())
                  
                  // Filter by distance if user location is available
                  let withinRadius = true
                  if (userLocation) {
                    const distance = calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      p.data.project.location.coordinates.lat,
                      p.data.project.location.coordinates.lng
                    )
                    withinRadius = distance <= radiusKm
                  }
                  
                  return matchesType && matchesSearch && withinRadius
                })
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
                      {project.status === 'private' ? (
                        <div className="flex flex-col gap-2">
                          <Button 
                            className="w-full gap-2" 
                            variant="default"
                            onClick={() => handlePromoteToProject(project._id)}
                            disabled={isPromoting === project._id}
                          >
                            {isPromoting === project._id ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Promoting...
                              </>
                            ) : (
                              <>
                                Promote to Project
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                          <Link href={`/opportunities/${project._id}`} className="w-full">
                            <Button className="w-full gap-2" variant="outline">
                              View Details
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <Link href={`/opportunities/${project._id}`} className="w-full">
                          <Button className="w-full gap-2" variant="outline">
                            View Details
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
