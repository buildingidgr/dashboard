"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { exchangeClerkToken, getAccessToken, setAccessToken } from "@/lib/services/auth"
import { useSession, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Phone, Building2, Calendar, Clock, Mail, History, ArrowRight } from "lucide-react"
import Link from "next/link"
import { usePageTitle } from "@/components/layouts/client-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { OpportunityLocationMap } from "@/components/maps/opportunity-location-map"
import { cn } from "@/lib/utils"
import { claimOpportunity } from "@/lib/services/opportunities"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MechBadge } from "@/components/ui/mech-badge"
import { categoryColors, simplifiedLabels } from "@/constants/map-categories"
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider"

interface PhoneObject {
  countryCode: string
  number: string
}

function isPhoneObject(phone: string | PhoneObject): phone is PhoneObject {
  return typeof phone === 'object' && 'number' in phone
}

interface OpportunityDetails {
  _id: string
  type: string
  data: {
    project: {
      category: string
      location: {
        address: string
        coordinates: {
          lat: number
          lng: number
        }
      }
      details: {
        title: string
        description: string
      }
    }
    contact: {
      fullName: string
      email: string
      phone: string
      countryCode?: string
    }
    metadata?: {
      submittedAt: string
      source: string
      environment: string
      messageId: string
    }
  }
  status: string
  metadata?: {
    submittedAt: string
    source: string
    environment: string
    messageId: string
  }
  lastStatusChange: {
    from: string
    to: string
    changedBy: string
    changedAt: string
  }
  statusHistory: Array<{
    from: string
    to: string
    changedBy: string
    changedAt: string
  }>
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-6 w-48" />
          </div>

          <Skeleton className="h-[400px] w-full rounded-lg" />

          <div className="grid gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[150px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function OpportunityDetailsPage() {
  const params = useParams<{ id: string }>()
  const [opportunity, setOpportunity] = useState<OpportunityDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { session } = useSession()
  const { user } = useUser()
  const { setTitle, setDescription } = usePageTitle()
  const router = useRouter()
  const [isClaiming, setIsClaiming] = useState(false)
  const { toast } = useToast()
  const [isUnclaimDialogOpen, setIsUnclaimDialogOpen] = useState(false)
  const [isUnclaiming, setIsUnclaiming] = useState(false)

  const fetchOpportunity = useCallback(async (id: string) => {
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/opportunities/${id}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch opportunity')
      }

      const data = await response.json()
      setOpportunity(data)
      setError(null)
      return data
    } catch (error) {
      console.error('Error fetching opportunity:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch opportunity')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch opportunity',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (params?.id && typeof params.id === 'string') {
      fetchOpportunity(params.id)
    }
  }, [params?.id, fetchOpportunity])

  useEffect(() => {
    async function initializeTokenAndFetch() {
      if (!session) {
        setIsLoading(false)
        return
      }

      try {
        const id = params?.id
        if (!id || typeof id !== 'string') {
          throw new Error('Invalid opportunity ID')
        }

        let accessToken = getAccessToken()
        
        if (!accessToken && user?.id && session?.id) {
          const tokens = await exchangeClerkToken(session.id, user.id)
          setAccessToken(tokens.access_token)
          accessToken = tokens.access_token
        }

        if (accessToken) {
          await fetchOpportunity(id)
        }
      } catch (error) {
        console.error('Failed to initialize token:', error)
        toast({
          title: 'Error',
          description: 'Failed to initialize session',
          variant: 'destructive'
        })
        setError('Failed to initialize session')
        setIsLoading(false)
      }
    }

    initializeTokenAndFetch()
  }, [session, user, params?.id, fetchOpportunity, toast])

  useEffect(() => {
    if (opportunity) {
      setTitle(opportunity.data.project.details.title)
      setDescription(opportunity.data.project.details.description)
    }
  }, [opportunity, setTitle, setDescription])

  const handleClaimOpportunity = async () => {
    const id = params?.id
    if (!id || typeof id !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid opportunity ID',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsClaiming(true)
      await claimOpportunity(id)
      toast({
        title: "Success!",
        description: "Opportunity has been claimed successfully. You can now find it in your claimed opportunities.",
      })
      // Refresh the opportunity data to show updated status
      await fetchOpportunity(id)
      // Redirect to claimed opportunities page
      router.push('/claimed')
    } catch (error) {
      console.error('Failed to claim opportunity:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to claim opportunity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClaiming(false)
    }
  }

  const handleUnclaimOpportunity = async () => {
    const id = params?.id
    if (!id || typeof id !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid opportunity ID',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsUnclaiming(true)
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error("No access token available")
      }

      const response = await fetch(`/api/opportunities/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status: 'public'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to unclaim opportunity")
      }

      toast({
        title: "Success!",
        description: "Opportunity has been unclaimed successfully.",
      })
      // Refresh the opportunity data to show updated status
      await fetchOpportunity(id)
      // Redirect to opportunities page after unclaiming
      router.push('/opportunities')
    } catch (error) {
      console.error('Failed to unclaim opportunity:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unclaim opportunity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUnclaiming(false)
      setIsUnclaimDialogOpen(false)
    }
  }

  if (isLoading || !opportunity) {
    return <PageSkeleton />
  }

  const coordinates = opportunity.data.project.location.coordinates
  const address = opportunity.data.project.location.address

  const handleShareLocation = () => {
    // Create a Google Maps URL with the location
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`
    
    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: opportunity.data.project.details.title,
        text: `Location: ${address}`,
        url: mapsUrl
      }).catch(error => {
        console.log('Error sharing:', error)
        // Fallback to opening in new tab
        window.open(mapsUrl, '_blank')
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      window.open(mapsUrl, '_blank')
    }
  }

  return (
    <div className="container max-w-[1200px] py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/public-opportunities" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Opportunities
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview Card */}
          <Card className="overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <MechBadge dotColor={categoryColors[opportunity.type]}>
                  {simplifiedLabels[opportunity.type]}
                </MechBadge>
                <Badge variant="outline" className={cn(
                  "border-2",
                  opportunity.status === 'private' 
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                )}>
                  {opportunity.status === 'private' ? 'Claimed' : 'Available'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {opportunity.data.project.details.title}
                </h1>
                {opportunity.status === 'private' ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsUnclaimDialogOpen(true)}
                    disabled={isUnclaiming}
                    className="flex items-center gap-2"
                  >
                    {isUnclaiming ? (
                      <>
                        <Skeleton className="h-4 w-4" />
                        Unclaiming...
                      </>
                    ) : (
                      <>
                        <History className="h-4 w-4" />
                        Unclaim Opportunity
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleClaimOpportunity}
                    disabled={isClaiming}
                    className="flex items-center gap-2"
                  >
                    {isClaiming ? (
                      <>
                        <Skeleton className="h-4 w-4" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        Claim Opportunity
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Posted {format(new Date(opportunity.metadata?.submittedAt || opportunity.data.metadata?.submittedAt || new Date()), 'PPp')}
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Project Details</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {opportunity.data.project.details.description}
                </p>
              </div>
            </div>
          </Card>

          {/* Location Card */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">Location</h3>
                  {opportunity.status === 'public' ? (
                    <p className="text-sm text-muted-foreground">
                      Approximate location shown for privacy. Claim this opportunity to see the exact address.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{address}</p>
                  )}
                </div>
                {opportunity.status === 'private' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleShareLocation}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Share Location
                  </Button>
                )}
              </div>
            </div>
            <div className="h-[400px] w-full relative">
              {opportunity.status === 'public' && (
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/80 to-transparent" />
              )}
              <GoogleMapsProvider>
                <OpportunityLocationMap
                  coordinates={coordinates}
                  zoom={16}
                  isDarkMode={false}
                />
              </GoogleMapsProvider>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="p-6 space-y-4">
            <h3 className="font-medium">Status Timeline</h3>
            <div className="space-y-3">
              {opportunity.statusHistory.map((status, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={cn(
                    "mt-1 h-2 w-2 rounded-full",
                    status.to === 'private' ? "bg-green-500" : "bg-blue-500"
                  )} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      Changed to {status.to === 'private' ? 'Claimed' : 'Available'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(status.changedAt), 'PPp')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Contact Information Card (Only shown when claimed) */}
          {opportunity.status === 'private' && (
            <Card className="p-6 space-y-4">
              <h3 className="font-medium">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{opportunity.data.contact.fullName}</p>
                    <p className="text-xs text-muted-foreground">Contact Person</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{opportunity.data.contact.email}</p>
                    <p className="text-xs text-muted-foreground">Email Address</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                    <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isPhoneObject(opportunity.data.contact.phone) 
                        ? `+${opportunity.data.contact.phone.countryCode} ${opportunity.data.contact.phone.number}`
                        : opportunity.data.contact.phone}
                    </p>
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Unclaim Confirmation Dialog */}
      <AlertDialog open={isUnclaimDialogOpen} onOpenChange={setIsUnclaimDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the opportunity available to other professionals. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnclaiming}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnclaimOpportunity}
              disabled={isUnclaiming}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
            >
              {isUnclaiming ? 'Unclaiming...' : 'Unclaim Opportunity'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 