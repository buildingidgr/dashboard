"use client"

import { ClaimedOpportunities } from "@/components/claimed-projects-table"
import { useEffect, useState } from "react"
import { useSession, useUser } from "@clerk/nextjs"
import { exchangeClerkToken, getAccessToken } from "@/lib/services/auth"
import { toast } from "sonner"
import { usePageTitle } from "@/components/layouts/client-layout"

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
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching claimed projects:', error)
      toast.error('Failed to load claimed projects')
    } finally {
      setIsLoading(false)
    }
  }

  // Map Project objects to Opportunity format
  const opportunities = projects.map(project => ({
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
  }))

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
    <div className="flex-1 flex-col p-8 md:flex">
      <ClaimedOpportunities projects={response} isLoading={isLoading} />
    </div>
  )
}