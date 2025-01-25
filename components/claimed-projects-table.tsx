"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, ArrowUpRight, Search, MapPin, Filter } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { getAccessToken } from "@/lib/services/auth"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Opportunity {
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

interface ClaimedOpportunitiesProps {
  projects: {
    opportunities: Opportunity[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
    summary: {
      totalOpportunities: number
      totalChanges: number
    }
  } | Opportunity[]
  isLoading?: boolean
}

export function ClaimedOpportunities({ projects, isLoading = false }: ClaimedOpportunitiesProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [unclaimingId, setUnclaimingId] = useState<string | null>(null)
  const [isUnclaiming, setIsUnclaiming] = useState(false)

  const handleUnclaimOpportunity = async (projectId: string) => {
    try {
      setIsUnclaiming(true)
      const token = getAccessToken()
      if (!token) throw new Error('No access token available')

      const response = await fetch(`/api/opportunities/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'public' })
      })

      if (!response.ok) {
        throw new Error('Failed to unclaim opportunity')
      }

      toast({
        title: "Success!",
        description: "Opportunity has been unclaimed successfully.",
      })

      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      console.error('Failed to unclaim opportunity:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unclaim opportunity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUnclaiming(false)
      setUnclaimingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
        <div className="h-64 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
      </div>
    )
  }

  // Handle both array and object response formats
  const opportunities = Array.isArray(projects) ? projects : projects?.opportunities || []
  const totalOpportunities = Array.isArray(projects) 
    ? projects.length 
    : projects?.summary?.totalOpportunities || 0

  const filteredProjects = opportunities.filter(project => {
    const matchesSearch = searchQuery === "" || 
      project.data.project.details.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.data.project.details.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.data.project.location.address.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = !statusFilter || project.currentStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalOpportunities} opportunities
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter(null)
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Search by title, description or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Search in project titles, descriptions and locations
              </p>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="in review">In Review</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Filter opportunities by their current status
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No opportunities found
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project._id} className="group">
                  <TableCell className="font-medium">
                    {project.data.project.details.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {project.data.project.location.address.split(', ').slice(0, 2).join(', ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {project.data.contact.fullName}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <a 
                          href={`mailto:${project.data.contact.email}`}
                          className="hover:text-blue-600"
                        >
                          {project.data.contact.email}
                        </a>
                        {project.data.contact.phone && (
                          <a 
                            href={`tel:${project.data.contact.phone}`}
                            className="hover:text-blue-600"
                          >
                            {project.data.contact.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{project.data.project.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        {project.lastChange?.changedAt 
                          ? format(new Date(project.lastChange.changedAt), 'PP')
                          : project.myChanges?.[project.myChanges.length - 1]?.changedAt
                            ? format(new Date(project.myChanges[project.myChanges.length - 1].changedAt), 'PP')
                            : 'No date available'
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/opportunities/${project._id}`}>
                          View Details
                          <ArrowUpRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setUnclaimingId(project._id)}
                        disabled={isUnclaiming}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {isUnclaiming && unclaimingId === project._id ? "Unclaiming..." : "Unclaim"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!unclaimingId} onOpenChange={(open) => !open && setUnclaimingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the opportunity available to other users and remove your access to private information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unclaimingId && handleUnclaimOpportunity(unclaimingId)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Unclaim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 