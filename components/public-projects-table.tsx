import { Project } from "@/types/project"
import { ProjectCard } from "@/components/project-card"
import { PaginationNumbers } from "@/components/ui/pagination-numbers"
import { Skeleton } from "@/components/ui/skeleton"

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

interface PublicProjectsTableProps {
  projects: Opportunity[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function PublicProjectsTable({ 
  projects = [],
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false
}: PublicProjectsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6">
          {[...Array(6)].map((_, i) => (
            <ProjectCard 
              key={i}
              project={{} as Opportunity}
              isLoading={true}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!projects?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h3 className="text-lg font-semibold">No projects found</h3>
        <p className="text-muted-foreground">There are currently no public projects available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Project cards */}
      <div className="grid grid-cols-1 gap-6">
        {projects.map((project) => (
          <ProjectCard 
            key={project._id} 
            project={project}
            isLoading={false}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <PaginationNumbers
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
} 