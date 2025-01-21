import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Clock, ArrowRight, User, Building2, Calendar, ArrowUpRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ProjectMap } from "@/components/project-map"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

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

interface ProjectCardProps {
  project: Opportunity
  isLoading?: boolean
}

const defaultCenter = {
  lat: 40.6401,
  lng: 22.9444
}

export function ProjectCardSkeleton() {
  return (
    <Card className="group relative p-6 space-y-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" /> {/* Category */}
            <Skeleton className="h-6 w-48" /> {/* Title */}
          </div>
          <Skeleton className="h-6 w-20" /> {/* Status */}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Map Skeleton */}
        <Skeleton className="h-[200px] w-full rounded-xl" />

        {/* Info Skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </Card>
  )
}

export function ProjectCard({ project, isLoading }: ProjectCardProps) {
  if (isLoading) {
    return <ProjectCardSkeleton />
  }

  // Safely access nested properties
  const contact = project.data?.contact
  const formattedDate = project.data?.metadata?.submittedAt
    ? formatDistanceToNow(new Date(project.data.metadata.submittedAt), { addSuffix: true })
    : 'Unknown'

  // Get coordinates from project data
  const coordinates = project.data?.project?.location?.coordinates || defaultCenter

  // Format address from string
  const address = project.data?.project?.location?.address || ''

  return (
    <Link href={`/opportunities/${project._id}`} className="block">
      <Card 
        className={cn(
          "group relative p-6 space-y-6 hover:shadow-lg transition-all duration-200 cursor-pointer",
          "bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50",
          "border border-gray-100 hover:border-gray-200 dark:border-gray-800 dark:hover:border-gray-700"
        )}
      >
        {/* Status Badge - Absolute positioned */}
        <Badge 
          variant={project.status === 'private' ? 'secondary' : 'default'}
          className={cn(
            "absolute top-4 right-4 capitalize",
            "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
            "text-blue-700 dark:text-blue-300 border-0"
          )}
        >
          {project.status}
        </Badge>

        {/* Header Section */}
        <div className="space-y-4 pr-24">
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" />
              Project
            </Badge>
            <div className="space-y-1">
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.data?.project?.category?.title || 'No title available'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {project.data?.project?.category?.description || 'No description available'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Map */}
          <div className="relative h-[200px] w-full rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <ProjectMap coordinates={coordinates} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Location */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-full border border-gray-100 dark:border-gray-800">
                <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Exact Location Hidden
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {address ? 'Claim this opportunity to view the exact address' : 'No address provided'}
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-full border border-gray-100 dark:border-gray-800">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Contact Details Hidden
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Claim this opportunity to view contact information
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Posted {formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Available Now</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    </Link>
  )
} 