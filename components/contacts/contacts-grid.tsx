"use client"

import { useState, useEffect, useCallback } from "react"
import { getAccessToken, exchangeClerkToken } from '@/lib/services/auth'
import { toast } from "sonner"
import { useSession, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Contact } from "./columns"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Plus, Search, SortAsc, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

interface ContactsResponse {
  data: Contact[]
  pagination: {
    currentPage: number
    pageSize: number
    totalPages: number
    totalCount: number
  }
}

const ITEMS_PER_PAGE = 10

export default function ContactsGrid() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const { session } = useSession()
  const { user } = useUser()
  const router = useRouter()

  const fetchContacts = useCallback(async () => {
    if (!session) return

    try {
      const accessToken = getAccessToken()
      
      if (!accessToken) {
        throw new Error("No access token available")
      }

      const queryParams = new URLSearchParams({
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
      })

      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }

      const response = await fetch(`/api/contacts?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.statusText}`)
      }

      const responseData: ContactsResponse = await response.json()
      
      if (Array.isArray(responseData.data)) {
        setContacts(responseData.data)
        setTotalPages(Math.max(1, responseData.pagination.totalPages))
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch contacts')
      setContacts([])
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery, session])

  useEffect(() => {
    const initializeTokenAndFetch = async () => {
      if (!session || !user) return
      setIsLoading(true)
      try {
        await exchangeClerkToken(session.id, user.id)
        await fetchContacts()
      } catch (error) {
        console.error('Error initializing:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeTokenAndFetch()
  }, [session, user, fetchContacts])

  useEffect(() => {
    if (session && !isLoading) {
      fetchContacts()
    }
  }, [currentPage, searchQuery, session, isLoading, fetchContacts])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="w-[250px] h-10" />
          <Skeleton className="w-[200px] h-10" />
        </div>
        <div className="rounded-lg border">
          <div className="border-b">
            <div className="grid grid-cols-5 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-4/5 h-4" />
              ))}
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 items-center p-4 border-b last:border-b-0">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="w-4/5 h-4" />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="w-[100px] h-10" />
          <Skeleton className="w-[200px] h-10" />
        </div>
      </div>
    )
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE

  return (
    <div className="w-full max-w-6xl p-4 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Contacts</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <SortAsc className="size-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Zap className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Filter</DropdownMenuItem>
              <DropdownMenuItem>Sort</DropdownMenuItem>
              <DropdownMenuItem>Properties</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/contacts/new')}>
            New <Plus className="ml-2 size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border [&_td]:border-l [&_th]:border-l">
        <Table className="text-sm [&_td]:py-2 [&_th]:py-2">
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-y hover:bg-transparent">
              <TableHead className="min-w-[200px] font-normal text-muted-foreground">Name</TableHead>
              <TableHead className="min-w-[200px] font-normal text-muted-foreground">Email</TableHead>
              <TableHead className="min-w-[150px] font-normal text-muted-foreground">Phone</TableHead>
              <TableHead className="min-w-[200px] font-normal text-muted-foreground">Location</TableHead>
              <TableHead className="min-w-[180px] font-normal text-muted-foreground">Updated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow 
                key={contact.id}
                className="group cursor-pointer hover:underline"
                onClick={() => router.push(`/contacts/${contact.id}`)}
              >
                <TableCell className="truncate">
                  <span className="truncate">{contact.firstName} {contact.lastName}</span>
                </TableCell>
                <TableCell className="truncate">
                  <span className="truncate">{contact.email}</span>
                </TableCell>
                <TableCell className="truncate">
                  <span className="truncate">
                    {contact.phones.find(p => p.primary)?.number || contact.phones[0]?.number || '-'}
                  </span>
                </TableCell>
                <TableCell className="truncate">
                  <span className="truncate">
                    {contact.address ? `${contact.address.city}, ${contact.address.country}` : '-'}
                  </span>
                </TableCell>
                <TableCell className="truncate">
                  <span className="truncate">{new Date(contact.updatedAt).toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()} // Prevent row click when clicking the menu
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/contacts/${contact.id}`);
                        }}
                      >
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/contacts/${contact.id}/edit`);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, contacts.length)} of {contacts.length} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 