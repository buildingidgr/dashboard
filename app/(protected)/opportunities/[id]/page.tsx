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
        throw new Error("Failed to unclaim opportunity")
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

  if (isLoading) {
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

            <Skeleton className="h-[300px] w-full rounded-lg" />

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
      <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-16">
        <Card className="flex flex-col items-center justify-center p-8 space-y-4">
          <h1 className="text-2xl font-bold">Opportunity Not Found</h1>
          <p className="text-muted-foreground">The requested opportunity could not be found.</p>
          <Button variant="outline" asChild>
            <Link href="/opportunities">
              <ArrowLeft className="mr-2 size-4" />
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
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-16">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {opportunity.data.project.details.title}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()} 
            className="bg-white/50 border-gray-200 px-3 h-8 backdrop-blur-sm dark:bg-gray-900/50 dark:border-gray-800"
          >
            <ArrowLeft className="size-4" />
            Back to Opportunities
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <MechBadge dotColor={categoryColors[opportunity.type]}>
                  {simplifiedLabels[opportunity.type]}
                </MechBadge>
              </div>
              <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                <h2 className="mb-2 text-lg font-medium">Project Details</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {opportunity.data.project.details.description}
                </p>
              </div>
              <div className="flex items-center gap-2 border-t border-gray-100 pt-4 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <Clock className="size-4" />
                <span className="text-sm">
                  Posted {format(new Date(opportunity.metadata?.submittedAt || opportunity.data.metadata?.submittedAt || new Date()), 'PPp')}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          {opportunity.status === 'private' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                    <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Contact Information</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const contactData = {
                      firstName: opportunity.data.contact.fullName.split(' ')[0],
                      lastName: opportunity.data.contact.fullName.split(' ')[1],
                      email: opportunity.data.contact.email,
                      phones: [
                        {
                          type: 'mobile',
                          number: opportunity.data.contact.phone,
                          primary: true
                        }
                      ],
                      address: {
                        city: opportunity.data.project.location.address.split(', ')[0],
                        unit: opportunity.data.project.location.address.split(', ')[1],
                        state: opportunity.data.project.location.address.split(', ')[2],
                        street: opportunity.data.project.location.address.split(', ')[3],
                        country: opportunity.data.project.location.address.split(', ')[4],
                        postalCode: opportunity.data.project.location.address.split(', ')[5]
                      },
                      company: {
                        name: opportunity.data.project.details.title,
                        title: opportunity.data.project.details.title
                      },
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
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {opportunity.data.contact.fullName}
                  </p>
                  {opportunity.data.project.details.title && (
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <Building2 className="size-4" />
                      <div>
                        <p className="font-medium">{opportunity.data.project.details.title}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <Phone className="size-4" />
                    <div className="flex flex-wrap items-center gap-2">
                      <a 
                        href={`tel:${opportunity.data.contact.phone}`} 
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {opportunity.data.contact.phone}
                      </a>
                      <div className="flex gap-2">
                        {opportunity.data.contact.countryCode && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                            {opportunity.data.contact.countryCode}
                          </span>
                        )}
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                          Primary
                        </span>
                      </div>
                    </div>
                  </div>
                  {opportunity.data.contact.email && (
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <Mail className="size-4" />
                      <a 
                        href={`mailto:${opportunity.data.contact.email}`} 
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {opportunity.data.contact.email}
                      </a>
                    </div>
                  )}
                  {opportunity.data.project.location.address && (
                    <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                      <MapPin className="size-4" />
                      <div className="space-y-0.5">
                        <p>{opportunity.data.project.location.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status History Card */}
          {opportunity.status === 'private' && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                  <History className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Status History</h2>
              </div>
              <div className="pl-12 space-y-4">
                {opportunity.statusHistory.map((status, index) => (
                  <div key={index} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <div className="rounded-full bg-gray-50 p-1.5 dark:bg-gray-700">
                      <ArrowRight className="size-4" />
                    </div>
                    <div className="flex-1">
                      <span>
                        Changed from <strong>{status.from}</strong> to <strong>{status.to}</strong>
                      </span>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {format(new Date(status.changedAt), 'PPp')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Quick Actions */}
        <div>
          <div className="sticky top-20 space-y-6">
            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm dark:border-blue-900/50 dark:from-gray-800 dark:to-gray-700">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {opportunity.status === 'private' 
                      ? 'You have claimed this opportunity'
                      : 'Claim this opportunity to start working on it'}
                  </p>
                </div>
                {opportunity.status === 'public' && (
                  <Button 
                    className="w-full bg-blue-600 text-white shadow-sm transition-all duration-200 hover:bg-blue-700"
                    onClick={handleClaimOpportunity}
                    disabled={isClaiming}
                  >
                    {isClaiming ? "Claiming..." : "Claim Opportunity"}
                  </Button>
                )}

                {opportunity.status === 'private' && (
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-blue-600 text-white shadow-sm transition-all duration-200 hover:bg-blue-700"
                      onClick={() => router.push(`/projects/new?opportunity=${opportunity._id}`)}
                    >
                      Create New Project
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:border-red-300 hover:text-red-700 dark:border-red-900/50 dark:hover:border-red-900"
                      onClick={() => setIsUnclaimDialogOpen(true)}
                      disabled={isUnclaiming}
                    >
                      {isUnclaiming ? "Unclaiming..." : "Unclaim Opportunity"}
                    </Button>
                  </div>
                )}

                <div className="space-y-4 border-t border-blue-200/50 pt-4 dark:border-blue-900/50">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <div className="rounded-full bg-blue-100/50 p-1.5 dark:bg-blue-900/50">
                      <Calendar className="size-4" />
                    </div>
                    <span className="text-sm">
                      Created {format(new Date(opportunity.metadata?.submittedAt || opportunity.data.metadata?.submittedAt || new Date()), 'PP')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <div className="rounded-full bg-blue-100/50 p-1.5 dark:bg-blue-900/50">
                      <Clock className="size-4" />
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

      <AlertDialog open={isUnclaimDialogOpen} onOpenChange={setIsUnclaimDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the opportunity available to other users and remove your access to private information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleUnclaimOpportunity}
            >
              Unclaim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 