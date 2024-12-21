"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession, useUser } from "@clerk/nextjs"

// Components
import ProjectCard from "@/components/opportunity-card"
import EmptyState from "@/components/empty-state"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { MultiSelect } from "@/components/ui/multi-select"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

// Icons
import { AlertCircle } from 'lucide-react'

// Utils
import { getAccessToken, setAccessToken } from '@/src/utils/tokenManager'
import { exchangeClerkToken } from "@/src/services/auth"

// Constants
const ITEMS_PER_PAGE = 15
const MAX_VISIBLE_PAGES = 5
const PROJECT_TYPES = [
  'Ηλεκτρομηχανολογικές Εγκαταστάσεις',
  'Συστήματα Ασφαλείας'
]

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
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  // Token initialization
  const initializeToken = async () => {
    if (!session) {
      setError(null)
      setIsLoading(false)
      return null
    }

    try {
      const tokens = await exchangeClerkToken(session.id, user?.id as string)
      setAccessToken(tokens.accessToken, tokens.expiresIn)
      return tokens.accessToken
    } catch (err) {
      console.error('Failed to initialize tokens:', err)
      setError('Authentication error. Please try logging in again.')
      setIsLoading(false)
      return null
    }
  }

  // Data fetching
  const fetchOpportunities = async (page: number, types: string[]) => {
    setIsLoading(true)
    setError(null)

    try {
      let token = getAccessToken()
      if (!token) {
        token = await initializeToken()
        if (!token) return
      }

      const typeParams = types.map(type => `category=${encodeURIComponent(type)}`).join('&')
      const fullUrl = `/api/opportunities?page=${page}&limit=${ITEMS_PER_PAGE}${typeParams ? '&' + typeParams : ''}`
      
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
  }

  // Event handlers
  const handlePageChange = (page: number) => setCurrentPage(page)
  
  const handleReset = () => {
    setCurrentPage(1)
    setSelectedTypes([])
    fetchOpportunities(1, [])
  }

  const handleTypeChange = (types: string[]) => {
    setSelectedTypes(types)
    setCurrentPage(1)
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

      await fetchOpportunities(currentPage, selectedTypes)
      router.push('/claimed')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to claim project')
    }
  }

  // Effects
  useEffect(() => {
    if (isSessionLoaded) {
      if (session) {
        const init = async () => {
          let token = getAccessToken()
          if (!token) token = await initializeToken()
          if (token) fetchOpportunities(currentPage, selectedTypes)
        }
        init()
      } else {
        setIsLoading(false)
      }
    }
  }, [session, isSessionLoaded])

  useEffect(() => {
    if (session && getAccessToken()) {
      fetchOpportunities(currentPage, selectedTypes)
    }
  }, [currentPage, selectedTypes])

  // Render helpers
  const renderPaginationItems = () => {
    const items = []
    const startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2))
    const endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1)

    // First page
    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1) }}>
            1
          </PaginationLink>
        </PaginationItem>
      )
      if (startPage > 2) {
        items.push(<PaginationEllipsis key="ellipsis-start" />)
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            href="#" 
            isActive={currentPage === i}
            onClick={(e) => { e.preventDefault(); handlePageChange(i) }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationEllipsis key="ellipsis-end" />)
      }
      items.push(
        <PaginationItem key="last">
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages) }}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

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

  // Main render
  return (
    <main>
      <Card className="border-none shadow-none px-4 sm:px-6 lg:px-8">
        <CardHeader>
          <CardTitle className="text-lg">Find public projects in your area</CardTitle>
        </CardHeader>
      </Card>
          
      <div className="mb-8 ml-6 mr-6 px-4 sm:px-6 lg:px-8">
        <MultiSelect
          options={PROJECT_TYPES.map(type => ({ label: type, value: type }))}
          onValueChange={handleTypeChange}
          placeholder="Filter projects by type"
          defaultValue={selectedTypes}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button 
            onClick={() => fetchOpportunities(currentPage, selectedTypes)} 
            className="mt-2"
            variant="outline"
          >
            Retry
          </Button>
        </Alert>
      )}

      {opportunities.length === 0 ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <EmptyState onReset={handleReset} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-6 sm:gap-y-8 mb-8 gap-x-12 px-4 sm:px-6 lg:px-8">
            {opportunities.map((opportunity) => (
              <ProjectCard 
                key={opportunity._id} 
                {...opportunity} 
                onClaim={() => handleClaimProject(opportunity._id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0 px-4 sm:px-6 lg:px-8 mb-16">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage > 1) handlePageChange(currentPage - 1)
                      }}
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault()
                        if (currentPage < totalPages) handlePageChange(currentPage + 1)
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} opportunities
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}

