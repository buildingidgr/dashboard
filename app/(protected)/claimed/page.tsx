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
  data: {
    project: {
      category: string
      location: {
        address: string
        lat: number
        lng: number
        parsedAddress: {
          streetNumber: string
          street: string
          city: string
          area: string
          country: string
          countryCode: string
          postalCode: string
        }
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
      countryCode: string
    }
  }
  currentStatus: string
  myChanges: Array<{
    from: string
    to: string
    changedAt: string
  }>
  totalChanges: number
  myChangesCount: number
  lastChange: {
    from: string
    to: string
    changedBy: string
    changedAt: string
  }
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
            <Skeleton className="size-10" /> {/* Filter */}
            <Skeleton className="size-10" /> {/* Sort */}
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
    return {
      _id: project._id,
      type: project.type,
      data: {
        project: {
          category: project.data.project.category,
          location: {
            address: project.data.project.location.address,
            lat: project.data.project.location.lat,
            lng: project.data.project.location.lng,
            parsedAddress: project.data.project.location.parsedAddress,
            coordinates: project.data.project.location.coordinates
          },
          details: {
            title: project.data.project.details.title,
            description: project.data.project.details.description
          }
        },
        contact: {
          fullName: project.data.contact.fullName,
          email: project.data.contact.email,
          phone: project.data.contact.phone,
          countryCode: project.data.contact.countryCode
        }
      },
      currentStatus: project.currentStatus,
      myChanges: project.myChanges,
      totalChanges: project.totalChanges,
      myChangesCount: project.myChangesCount,
      lastChange: project.lastChange
    }
  })

  // Create the response object with pagination and summary
  const response = {
    opportunities,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: opportunities.length,
      itemsPerPage: opportunities.length,
      hasNextPage: false,
      hasPreviousPage: false
    },
    summary: {
      totalOpportunities: opportunities.length,
      totalChanges: opportunities.reduce((acc, opp) => acc + (opp.totalChanges || 0), 0)
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-16">
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
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 dark:border-gray-800 dark:from-gray-900 dark:to-gray-800">
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
        </div>

        {/* Projects */}
        <ClaimedOpportunities
          projects={response}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}