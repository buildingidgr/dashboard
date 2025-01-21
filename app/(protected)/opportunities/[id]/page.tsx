"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { exchangeClerkToken, getAccessToken, setAccessToken } from "@/lib/services/auth"
import { useSession, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Phone, Building2, Calendar, Clock, Mail, History, ArrowRight } from "lucide-react"
import Link from "next/link"
import { usePageTitle } from "@/components/layouts/client-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

interface OpportunityDetails {
  _id: string
  type: string
  data: {
    id: string
    projectType: string
    project: {
      category: {
        title: string
        description: string
      }
      location: {
        address: string
        coordinates: {
          lat: number
          lng: number
        }
      }
      details: {
        description: string
      }
    }
    contact: {
      firstName: string
      lastName: string
      email: string
      phones: Array<{
        type: string
        number: string
        primary: boolean
      }>
      address: {
        city: string
        unit?: string
        state: string
        street: string
        country: string
        postalCode: string
      }
      company: {
        name: string
        title: string
      }
    }
    metadata: {
      submittedAt: string
      locale: string
      source: string
      version: string
    }
  }
  status: string
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

  useEffect(() => {
    const initializeTokenAndFetch = async () => {
      if (!session) {
        setIsLoading(false)
        return
      }

      try {
        let accessToken = getAccessToken()
        
        if (!accessToken && user?.id && session?.id) {
          const tokens = await exchangeClerkToken(session.id, user.id)
          setAccessToken(tokens.access_token)
          accessToken = tokens.access_token
        }

        if (accessToken) {
          await fetchOpportunity()
        }
      } catch (error) {
        console.error('Failed to initialize token:', error)
        toast({
          title: "Error",
          description: "Failed to initialize session",
          variant: "destructive",
        })
        setError('Failed to initialize session')
        setIsLoading(false)
      }
    }

    initializeTokenAndFetch()
  }, [session, user])

  useEffect(() => {
    if (opportunity) {
      setTitle(opportunity.data.project.category.title)
      setDescription(opportunity.data.project.category.description)
    }
  }, [opportunity, setTitle, setDescription])

  async function fetchOpportunity() {
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error("No access token available")
      }

      if (!params?.id) {
        throw new Error("Opportunity ID is required")
      }

      console.log('Fetching opportunity:', params.id)
      const response = await fetch(`/api/opportunities/${params.id}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { message: errorText }
        }
        throw new Error(errorData.message || errorData.error || 'Failed to fetch opportunity')
      }

      const data = await response.json()
      console.log('Opportunity data:', data)
      setOpportunity(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching opportunity:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch opportunity')
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch opportunity',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimOpportunity = async () => {
    if (!params?.id) {
      toast({
        title: "Error",
        description: "Invalid opportunity ID",
        variant: "destructive",
      })
      return
    }

    try {
      setIsClaiming(true)
      await claimOpportunity(params.id)
      toast({
        title: "Success!",
        description: "Opportunity has been claimed successfully. You can now find it in your claimed opportunities.",
      })
      // Refresh the opportunity data to show updated status
      await fetchOpportunity()
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
    if (!params?.id) {
      toast({
        title: "Error",
        description: "Invalid opportunity ID",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUnclaiming(true)
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error("No access token available")
      }

      const response = await fetch(`/api/opportunities/${params.id}/status`, {
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
        throw new Error("Failed to unclaim opportunity")
      }

      toast({
        title: "Success!",
        description: "Opportunity has been unclaimed successfully.",
      })
      // Refresh the opportunity data to show updated status
      await fetchOpportunity()
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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
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

            <Skeleton className="w-full h-[300px] rounded-lg" />

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

  if (error || !opportunity) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Card className="flex flex-col items-center justify-center p-8 space-y-4">
          <h1 className="text-2xl font-bold">Opportunity Not Found</h1>
          <p className="text-muted-foreground">The requested opportunity could not be found.</p>
          <Button variant="outline" asChild>
            <Link href="/opportunities">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Opportunities
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'closed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="relative">
        {/* Back Button - Floating */}
        <div className="sticky top-4 z-10 mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()} 
            className="h-8 px-3 bg-white/50 backdrop-blur-sm border-gray-200 dark:bg-gray-900/50 dark:border-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full border-2", 
                      getStatusColor(opportunity.status)
                    )}
                  >
                    {opportunity.status}
                  </Badge>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {opportunity.data.project.category.title}
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-300">
                  {opportunity.data.project.category.description}
                </p>
                <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h2 className="text-lg font-medium mb-2">Project Details</h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    {opportunity.data.project.details.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    Posted {format(new Date(opportunity.data.metadata.submittedAt), 'PPp')}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Accuracy Warning */}
            {opportunity.status === 'public' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-yellow-800 dark:text-yellow-200">
                <p className="text-sm">
                  <strong>Note:</strong> The location shown on the map is approximate. The exact location will be revealed after claiming this opportunity.
                </p>
              </div>
            )}

            {/* Map Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm h-[400px]">
              <OpportunityLocationMap coordinates={opportunity.data.project.location.coordinates} />
            </div>

            {/* Details Cards */}
            <div className="space-y-6">
              {/* Location Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Location Details</h2>
                </div>
                <div className="pl-12 space-y-2 text-gray-600 dark:text-gray-300">
                  {opportunity.status === 'private' ? (
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {opportunity.data.project.location.address}
                    </p>
                  ) : (
                    <p>Full address details will be available after claiming the opportunity.</p>
                  )}
                </div>
              </div>

              {/* Contact Card */}
              {opportunity.status === 'private' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Contact Information</h2>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const contactData = {
                          firstName: opportunity.data.contact.firstName,
                          lastName: opportunity.data.contact.lastName,
                          email: opportunity.data.contact.email,
                          phones: opportunity.data.contact.phones,
                          address: opportunity.data.contact.address,
                          company: opportunity.data.contact.company,
                          opportunityIds: [opportunity._id]
                        }
                        const encodedData = encodeURIComponent(JSON.stringify(contactData))
                        router.push(`/contacts/new?data=${encodedData}`)
                      }}
                      className="text-blue-600 dark:text-blue-400"
                    >
                      Add to Contacts
                    </Button>
                  </div>
                  <div className="pl-12 space-y-6">
                    <div className="space-y-1">
                      <p className="font-medium text-lg text-gray-900 dark:text-gray-100">
                        {opportunity.data.contact.firstName} {opportunity.data.contact.lastName}
                      </p>
                      {opportunity.data.contact.company && (
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{opportunity.data.contact.company.name}</p>
                            {opportunity.data.contact.company.title && (
                              <p className="text-sm text-gray-500">{opportunity.data.contact.company.title}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {opportunity.data.contact.phones.map((phone, index) => (
                        <div key={index} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <div className="flex items-center gap-2 flex-wrap">
                            <a 
                              href={`tel:${phone.number}`} 
                              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                              {phone.number}
                            </a>
                            <div className="flex gap-2">
                              {phone.type && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                                  {phone.type}
                                </span>
                              )}
                              {phone.primary && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {opportunity.data.contact.email && (
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a 
                            href={`mailto:${opportunity.data.contact.email}`} 
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {opportunity.data.contact.email}
                          </a>
                        </div>
                      )}
                      {opportunity.data.contact.address && (
                        <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                          <MapPin className="h-4 w-4 mt-1 text-gray-400" />
                          <div className="space-y-0.5">
                            <p>{opportunity.data.contact.address.street}</p>
                            {opportunity.data.contact.address.unit && (
                              <p>Unit {opportunity.data.contact.address.unit}</p>
                            )}
                            <p>
                              {opportunity.data.contact.address.city}, {opportunity.data.contact.address.state} {opportunity.data.contact.address.postalCode}
                            </p>
                            <p>{opportunity.data.contact.address.country}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status History Card */}
              {opportunity.status === 'private' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Status History</h2>
                  </div>
                  <div className="pl-12 space-y-4">
                    {opportunity.statusHistory.map((status, index) => (
                      <div key={index} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded-full">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <span>
                            Changed from <strong>{status.from}</strong> to <strong>{status.to}</strong>
                          </span>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {format(new Date(status.changedAt), 'PPp')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div>
            <div className="sticky top-20 space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-blue-100 dark:border-blue-900/50 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {opportunity.status === 'private' 
                        ? 'You have claimed this opportunity'
                        : 'Claim this opportunity to start working on it'}
                    </p>
                  </div>
                  {opportunity.status === 'public' && (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
                      onClick={handleClaimOpportunity}
                      disabled={isClaiming}
                    >
                      {isClaiming ? "Claiming..." : "Claim Opportunity"}
                    </Button>
                  )}

                  {opportunity.status === 'private' && (
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200"
                        onClick={() => router.push(`/projects/new?opportunity=${opportunity._id}`)}
                      >
                        Create New Project
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-900"
                        onClick={() => setIsUnclaimDialogOpen(true)}
                        disabled={isUnclaiming}
                      >
                        {isUnclaiming ? "Unclaiming..." : "Unclaim Opportunity"}
                      </Button>
                    </div>
                  )}

                  <div className="pt-4 border-t border-blue-200/50 dark:border-blue-900/50 space-y-4">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <div className="p-1.5 bg-blue-100/50 dark:bg-blue-900/50 rounded-full">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="text-sm">
                        Created {format(new Date(opportunity.data.metadata.submittedAt), 'PP')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <div className="p-1.5 bg-blue-100/50 dark:bg-blue-900/50 rounded-full">
                        <Clock className="h-4 w-4" />
                      </div>
                      <span className="text-sm">
                        Last updated {format(new Date(opportunity.lastStatusChange.changedAt), 'PP')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={isUnclaimDialogOpen} onOpenChange={setIsUnclaimDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unclaim Opportunity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unclaim this opportunity? This will make it available to other users and remove your access to private information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnclaimOpportunity}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Unclaim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 