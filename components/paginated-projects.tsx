"use client"

import { useState, useEffect } from "react"
import { getAccessToken, setAccessToken } from '@/src/utils/tokenManager';
import { useSession, useUser } from "@clerk/nextjs"
import { exchangeClerkToken } from "@/src/services/auth"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { SignInButton } from "@clerk/nextjs"
import ClaimedProjectsTable from "@/components/claimed-projects-table"

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
}

export default function PaginatedProjects() {
  const { session, isLoaded: isSessionLoaded } = useSession();
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initializeToken = async () => {
    if (!session) {
      console.log('No session available, skipping token initialization');
      setError('Please sign in to view your claimed projects');
      return null;
    }

    try {
      console.log('Exchanging token with session ID:', session.id);
      const tokens = await exchangeClerkToken(session.id, user?.id as string);
      console.log('Token exchange successful');
      setAccessToken(tokens.accessToken, tokens.expiresIn);
      return tokens.accessToken;
    } catch (err) {
      console.error('Failed to initialize tokens:', err);
      setError('Authentication error. Please try logging in again.');
      return null;
    }
  };

  const fetchProjects = async (page: number) => {
    setIsLoading(true)
    try {
      let token = await getAccessToken();
      
      if (!token) {
        console.log('No token found, attempting to initialize...');
        token = await initializeToken();
        if (!token) {
          return;
        }
      }

      console.log('Using token for request:', token ? 'Token present' : 'No token');
      
      const response = await fetch(`/api/opportunities/my-changes?page=${page}&limit=10`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', errorText);
        throw new Error(`Failed to fetch claimed projects: ${errorText}`);
      }

      const data: PaginatedResponse = await response.json()
      setProjects(data.opportunities)
      setCurrentPage(data.pagination.currentPage)
      setTotalPages(data.pagination.totalPages)
      setError(null)
    } catch (err) {
      console.error('Error fetching claimed projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch claimed projects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isSessionLoaded && session) {
      fetchProjects(currentPage);
    } else if (isSessionLoaded) {
      setIsLoading(false);
      setError(null);
    }
  }, [isSessionLoaded, session]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (session) {
      fetchProjects(page);
    }
  }

  if (!isSessionLoaded || isLoading) {
    return <div className="flex justify-center items-center min-h-[200px]">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <h2 className="text-xl font-semibold text-gray-900">Sign in to view your claimed projects</h2>
        <p className="text-gray-600 mb-4">You need to be signed in to access this page</p>
        <SignInButton mode="modal">
          <Button>
            Sign In
          </Button>
        </SignInButton>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => fetchProjects(currentPage)}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Toaster richColors position="top-center" />
      {projects.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">No claimed projects found</p>
        </div>
      ) : (
        <ClaimedProjectsTable 
          projects={projects}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

