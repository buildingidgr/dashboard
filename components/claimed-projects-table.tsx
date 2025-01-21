"use client"

import { Card } from "@/components/ui/card"
import { Phone, Mail, MapPin, Calendar, ArrowUpRight, Clock, Tag, ArrowRight, Building2 } from "lucide-react"
import { format } from "date-fns"
import { useTheme } from "@/components/layouts/client-layout"
import { cn } from "@/lib/utils"
import { ProjectMap } from "@/components/maps/project-map"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AddressObject {
  street: string
  unit?: string
  city: string
  state: string
  country: string
  postalCode: string
}

interface Opportunity {
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

interface ContactData {
  firstName: string
  lastName: string
  email: string
  phones: Array<{
    type: string
    number: string
    primary: boolean
  }>
  address?: {
    city: string
    unit?: string
    state: string
    street: string
    country: string
    postalCode: string
  }
  company?: {
    name: string
    title: string
  }
  opportunityIds: string[]
}

// Helper function to format address
function formatAddress(address: string | AddressObject): string {
  if (typeof address === 'string') {
    return address;
  }
  
  const parts = [
    address.street,
    address.unit ? `Unit ${address.unit}` : null,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country
  ].filter(Boolean);
  
  return parts.join('\n');
}

interface ClaimedOpportunitiesProps {
  projects: Opportunity[]
  isLoading?: boolean
}

function OpportunitySkeleton() {
  return (
    <Card className="p-6">
      <div className="flex flex-col space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </Card>
  )
}

export function ClaimedOpportunities({ projects, isLoading = false }: ClaimedOpportunitiesProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        <OpportunitySkeleton />
        <OpportunitySkeleton />
        <OpportunitySkeleton />
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {projects.map((project) => (
        <Link key={project._id} href={`/opportunities/${project._id}`}>
          <Card className="p-6 hover:shadow-md transition-all duration-200">
            <div className="flex flex-col space-y-4">
              {/* Header with Status and Date */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full border-2",
                    project.status === 'active' && "bg-green-500/10 text-green-500 border-green-500/20",
                    project.status === 'pending' && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                    project.status === 'closed' && "bg-red-500/10 text-red-500 border-red-500/20",
                    project.status === 'private' && "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  )}
                >
                  {project.status}
                </Badge>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    {format(new Date(project.data.metadata.submittedAt), 'PP')}
                  </span>
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {project.data.project.category.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                  {project.data.project.details.description}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Badge variant="secondary" className="text-xs">
                    {project.data.projectType}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="group">
                  View Details
                  <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
} 