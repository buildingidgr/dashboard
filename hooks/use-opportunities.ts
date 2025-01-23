import { useState, useEffect } from "react"
import { useSession, useUser } from "@clerk/nextjs"
import { exchangeClerkToken, getAccessToken } from "@/lib/services/auth"
import { toast } from "sonner"

export interface Opportunity {
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

interface UseOpportunitiesProps {
  page?: number
  limit?: number
}

interface UseOpportunitiesReturn {
  projects: Opportunity[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  error: Error | null
  handlePageChange: (page: number) => void
}

export function useOpportunities({ 
  page = 1, 
  limit = 10 
}: UseOpportunitiesProps = {}): UseOpportunitiesReturn {
  const [projects, setProjects] = useState<Opportunity[]>([])
  const [currentPage, setCurrentPage] = useState(page)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { session } = useSession()
  const { user } = useUser()

  const fetchProjects = async (token: string) => {
    try {
      const response = await fetch(`/api/opportunities?page=${currentPage}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch opportunities')
      }

      const data = await response.json()
      console.log('API Response:', data)
      
      // Handle the response structure with opportunities array and pagination
      if (data.opportunities && Array.isArray(data.opportunities)) {
        setProjects(data.opportunities)
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages)
          setCurrentPage(data.pagination.currentPage)
        } else {
          setTotalPages(Math.ceil(data.opportunities.length / limit))
        }
      } else {
        console.error('Unexpected API response structure:', data)
        setProjects([])
        setTotalPages(1)
      }
      
      setError(null)
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      setError(error as Error)
      toast.error((error as Error).message || 'Failed to load opportunities')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!session) {
      setIsLoading(false)
      return
    }

    const initializeTokenAndFetch = async () => {
      try {
        let token = getAccessToken()
        if (!token) {
          const tokens = await exchangeClerkToken(session.id, user?.id as string)
          token = tokens.access_token
        }
        fetchProjects(token)
      } catch (error) {
        console.error('Failed to initialize token:', error)
        setError(error as Error)
        toast.error('Failed to initialize session')
        setIsLoading(false)
      }
    }

    initializeTokenAndFetch()
  }, [session, user, currentPage, limit])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setIsLoading(true)
  }

  return {
    projects,
    currentPage,
    totalPages,
    isLoading,
    error,
    handlePageChange
  }
} 