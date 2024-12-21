"use client"

import { useState, useEffect } from "react"
import { getAccessToken, setAccessToken } from '@/src/utils/tokenManager'
import { toast } from "sonner"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useSession, useUser } from "@clerk/nextjs"
import { exchangeClerkToken } from "@/src/services/auth"
import { PaginationState } from "@tanstack/react-table"

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phones: {
    type: string
    number: string
    primary: boolean
  }[]
  address?: {
    street: string
    city: string
    state: string
    country: string
  }
  company?: {
    name: string
  }
}

interface ContactsResponse {
  data: Contact[]
  pagination: {
    currentPage: number
    pageSize: number
    totalPages: number
    totalCount: number
  }
}

export default function ContactsGrid() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [totalPages, setTotalPages] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const { session } = useSession()
  const { user } = useUser()

  useEffect(() => {
    const initializeTokenAndFetch = async () => {
      if (!session) {
        console.log('No session available, skipping initialization')
        return
      }

      try {
        console.log('Checking token state before initialization...')
        let accessToken = getAccessToken()
        
        if (!accessToken) {
          console.log('No token found, initializing...')
          const tokens = await exchangeClerkToken(session.id, user?.id as string)
          console.log('Token exchange successful')
          setAccessToken(tokens.accessToken, tokens.expiresIn)
          accessToken = tokens.accessToken
        }

        if (accessToken) {
          await fetchContacts()
        }
      } catch (error) {
        console.error('Failed to initialize token:', error)
        toast.error('Failed to initialize session')
      }
    }

    initializeTokenAndFetch()
  }, [session, user])

  useEffect(() => {
    if (session) {
      fetchContacts()
    }
  }, [pagination.pageIndex, pagination.pageSize, searchQuery])

  async function fetchContacts() {
    try {
      console.log('Starting fetchContacts...')
      const accessToken = getAccessToken()
      console.log('Access token state:', {
        exists: !!accessToken,
        length: accessToken?.length,
        preview: accessToken ? `${accessToken.substring(0, 10)}...` : 'null'
      })
      
      if (!accessToken) {
        console.log('No access token found, throwing error')
        throw new Error("No access token available")
      }

      const queryParams = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
      })

      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }

      console.log('Fetching contacts with params:', Object.fromEntries(queryParams.entries()))
      const response = await fetch(`/api/contacts?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      console.log('API Response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log('Error response body:', errorText)
        
        let errorMessage
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`
          console.log('Parsed error data:', errorData)
        } catch {
          errorMessage = `HTTP error! status: ${response.status}, body: ${errorText}`
          console.log('Failed to parse error response as JSON')
        }
        throw new Error(errorMessage)
      }

      const responseData: ContactsResponse = await response.json()
      console.log('Contacts fetched successfully:', {
        count: responseData.data?.length,
        pagination: responseData.pagination,
        firstContact: responseData.data?.[0] ? {
          id: responseData.data[0].id,
          name: `${responseData.data[0].firstName} ${responseData.data[0].lastName}`
        } : null
      })
      
      setContacts(responseData.data || [])
      setTotalPages(responseData.pagination.totalPages)
    } catch (error) {
      console.error('Error in fetchContacts:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      })
      
      let errorMessage = 'Failed to fetch contacts'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      toast.error(errorMessage)
      setContacts([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="px-4 space-y-4">
      <DataTable 
        columns={columns} 
        data={contacts} 
        pageCount={totalPages}
        onPaginationChange={setPagination}
        searchPlaceholder="Search contacts..."
      />
    </div>
  )
} 