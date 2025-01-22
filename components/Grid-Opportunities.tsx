"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession, useUser } from "@clerk/nextjs"
import Link from 'next/link'
import Image from 'next/image'

// Components
import { EmptyState } from "@/components/empty-state"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Icons
import { AlertCircle, MapPin, Calendar, ArrowRight, Search } from 'lucide-react'

// Utils
import { exchangeClerkToken, getAccessToken, setAccessToken } from "@/lib/services/auth"

// Constants
const ITEMS_PER_PAGE = 15

// Types
interface Project {
  _id: string
  type: string
  data: {
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
      fullName: string
      email: string
      phone: {
        countryCode: string
        number: string
      }
    }
    metadata: {
      submittedAt: string
      locale: string
      source: string
      version: string
    }
  }
  status: 'public' | 'private'
}

interface PaginatedResponse {
  opportunities: Project[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  filter: {
    category: string
    appliedQuery: {
      status: string
    }
  }
}

// Helper functions
const formatAddress = (address: string) => {
  return address.split(',').slice(0, 2).join(',')
}

export default function GridOpportunities() {
  const router = useRouter()
  const { session, isLoaded: isSessionLoaded } = useSession()
  const { user } = useUser()
  
  // State
  const [opportunities, setOpportunities] = useState<Project[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Token initialization
  const initializeToken = useCallback(async () => {
    if (!session) {
      setError(null)
      setIsLoading(false)
      return null
    }

    try {
      const tokens = await exchangeClerkToken(session.id, user?.id as string)
      setAccessToken(tokens.access_token)
      return tokens.access_token
    } catch (err) {
      console.error('Failed to initialize tokens:', err)
      setError('Authentication error. Please try logging in again.')
      setIsLoading(false)
      return null
    }
  }, [session, user?.id])

  // Data fetching
  const fetchOpportunities = useCallback(async (page: number) => {
    setIsLoading(true)
    setError(null)

    try {
      let token = getAccessToken()
      if (!token) {
        token = await initializeToken()
        if (!token) return
      }

      const fullUrl = `/api/opportunities?page=${page}&limit=${ITEMS_PER_PAGE}`
      
      const response = await fetch(fullUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(response.status === 404 
          ? `API endpoint not found: ${fullUrl}`
          : `HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data: PaginatedResponse = await response.json()
      
      if (!data.opportunities) {
        throw new Error("Invalid response format from server")
      }

      setOpportunities(data.opportunities)
      setCurrentPage(data.pagination.currentPage)
      setTotalPages(data.pagination.totalPages)
      setTotalItems(data.pagination.totalItems)
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setError("Network error: Unable to connect to the server. Please check your internet connection and try again.")
      } else if (error instanceof Error) {
        setError(`Error: ${error.message}`)
      } else {
        setError("An unknown error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }, [initializeToken])

  // Event handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchOpportunities(page)
  }
  
  const handleReset = () => {
    setCurrentPage(1)
    fetchOpportunities(1)
  }

  const handleClaimProject = async (opportunityId: string) => {
    try {
      const token = getAccessToken()
      if (!token) throw new Error('No access token available')

      const response = await fetch(`/api/opportunities/${opportunityId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'private' })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to claim project: ${errorText}`)
      }

      await fetchOpportunities(currentPage)
      router.push('/claimed')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to claim project')
    }
  }

  // Effects
  useEffect(() => {
    const init = async () => {
      await initializeToken()
      await fetchOpportunities(currentPage)
    }
    init()
  }, [currentPage, fetchOpportunities, initializeToken])

  // Loading state
  if (!isSessionLoaded || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  // Unauthenticated state
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <h2 className="text-xl font-semibold text-gray-900">Sign in to view public projects</h2>
        <p className="text-gray-600 mb-4">You need to be signed in to access this page</p>
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button 
          onClick={() => fetchOpportunities(currentPage)} 
          className="mt-2"
          variant="outline"
        >
          Retry
        </Button>
      </Alert>
    )
  }

  // Empty state
  if (opportunities.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <EmptyState 
          title="No opportunities found"
          description="There are currently no public opportunities available in your area."
          actionLabel="Reset filters"
          actionOnClick={handleReset}
          imagePath="/empty-opportunities.svg"
        />
      </div>
    )
  }

  // Main render
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-8"
          />
        </div>
        <Button variant="outline">
          Filters
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="residential">Residential</TabsTrigger>
          <TabsTrigger value="commercial">Commercial</TabsTrigger>
          <TabsTrigger value="industrial">Industrial</TabsTrigger>
          <TabsTrigger value="renovation">Renovation</TabsTrigger>
          <TabsTrigger value="new">New Construction</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Projects Grid */}
      <div className="grid gap-6">
        {opportunities.map((project) => (
          <Card key={project._id}>
            <div className="flex gap-6 p-6">
              {/* Map Preview */}
              <div className="w-24 h-24 rounded-lg shrink-0 overflow-hidden relative">
                <Image
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${project.data.project.location.coordinates.lat},${project.data.project.location.coordinates.lng}&zoom=15&size=200x200&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&markers=color:red%7C${project.data.project.location.coordinates.lat},${project.data.project.location.coordinates.lng}`}
                  alt="Location preview"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <CardHeader className="p-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {project.data.project.category.title}
                    </span>
                  </div>
                  <CardTitle className="text-xl">
                    {project.data.project.details.description}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 py-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">
                        {formatAddress(project.data.project.location.address)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(project.data.metadata.submittedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-0 pt-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <a 
                      href={`mailto:${project.data.contact.email}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {project.data.contact.email}
                    </a>
                    {project.data.contact.phone && (
                      <a 
                        href={`tel:${project.data.contact.phone.countryCode}${project.data.contact.phone.number}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        +{project.data.contact.phone.countryCode} {project.data.contact.phone.number}
                      </a>
                    )}
                  </div>
                </CardFooter>
              </div>

              {/* Action */}
              <div className="flex items-start">
                <Button 
                  onClick={() => handleClaimProject(project._id)}
                  className="flex items-center gap-2"
                >
                  Claim Project
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {opportunities.length} of {totalItems} opportunities
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

