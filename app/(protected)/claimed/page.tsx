"use client"

import { ClaimedOpportunities } from "@/components/claimed-projects-table"
import { useEffect, useState } from "react"
import { useSession, useUser } from "@clerk/nextjs"
import { exchangeClerkToken, getAccessToken } from "@/lib/services/auth"
import { toast } from "sonner"
import { usePageTitle } from "@/components/layouts/client-layout"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Project {
  _id: string
  type: string
  currentStatus: string
  data: {
    project: {
      category: {
        title: string
        description: string
      }
      location: {
        address: {
          street: string
          unit: string
          city: string
          state: string
          country: string
          postalCode: string
        }
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
    }
    metadata: {
      submittedAt: string
      locale: string
      source: string
      version: string
    }
  }
  lastChange: {
    changedAt: string
    changedBy: string
    from: string
    to: string
  }
  myChanges: Array<{
    changedAt: string
    from: string
    to: string
  }>
  myChangesCount: number
  totalChanges: number
}

function PageSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-16 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" /> {/* Title */}
            <Skeleton className="h-4 w-96" /> {/* Description */}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[200px]" /> {/* Search */}
            <Skeleton className="h-10 w-10" /> {/* Filter */}
            <Skeleton className="h-10 w-10" /> {/* Sort */}
          </div>
        </div>
        
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Projects skeleton */}
      <ClaimedOpportunities
        projects={[]}
        isLoading={true}
      />
    </div>
  )
}

export default function ClaimedProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { session } = useSession()
  const { user } = useUser()
  const { setTitle, setDescription } = usePageTitle()

  useEffect(() => {
    setTitle("Claimed Opportunities")
    setDescription("Manage and track your claimed opportunities")
  }, [setTitle, setDescription])

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
        toast.error('Failed to initialize session')
        setIsLoading(false)
      }
    }

    initializeTokenAndFetch()
  }, [session, user])

  async function fetchProjects(token: string) {
    try {
      const response = await fetch('/api/opportunities/my-changes?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch claimed projects')
      }

      const data = await response.json()
      console.log('API Response:', data)
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching claimed projects:', error)
      toast.error('Failed to load claimed projects')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <PageSkeleton />
  }

  const stats = [
    {
      label: "Total Claimed",
      value: projects.length,
    },
    {
      label: "Active Projects",
      value: projects.filter(p => p.currentStatus === 'active').length,
    },
    {
      label: "Completed",
      value: projects.filter(p => p.currentStatus === 'completed').length,
    },
  ]

  // Map Project objects to Opportunity format
  const opportunities = projects.map(project => {
    // Format address as a string
    const address = project.data.project.location.address;
    const addressStr = [
      address.street,
      address.unit,
      address.city,
      address.state,
      address.country,
      address.postalCode
    ].filter(Boolean).join(', ');

    return {
      _id: project._id,
      type: project.type,
      data: {
        id: project._id,
        projectType: project.type,
        project: {
          ...project.data.project,
          location: {
            address: addressStr,
            coordinates: project.data.project.location.coordinates
          }
        },
        contact: {
          ...project.data.contact,
          // Add missing fields required by Opportunity interface
          address: {
            city: address.city,
            unit: address.unit,
            state: address.state,
            street: address.street,
            country: address.country,
            postalCode: address.postalCode
          },
          company: {
            name: "N/A",
            title: "N/A"
          }
        },
        metadata: project.data.metadata
      },
      status: project.currentStatus,
      lastStatusChange: {
        from: project.lastChange.from,
        to: project.lastChange.to,
        changedBy: project.lastChange.changedBy,
        changedAt: project.lastChange.changedAt
      },
      statusHistory: project.myChanges.map(change => ({
        from: change.from,
        to: change.to,
        changedBy: project.lastChange.changedBy, // Using lastChange.changedBy since myChanges doesn't have it
        changedAt: change.changedAt
      }))
    }
  })

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-16">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100">
                Claimed Opportunities
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Manage and track your claimed opportunities
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search opportunities..."
                  className="pl-8 w-[250px] bg-white dark:bg-gray-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="shrink-0">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-gray-100 dark:border-gray-800">
                <div className="space-y-1">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['All', 'Active', 'Pending', 'Completed'].map((status) => (
              <Badge
                key={status}
                variant={status === 'All' ? 'default' : 'outline'}
                className="px-3 py-1 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {status}
              </Badge>
            ))}
          </div>
        </div>

        {/* Projects */}
        <ClaimedOpportunities
          projects={opportunities}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}