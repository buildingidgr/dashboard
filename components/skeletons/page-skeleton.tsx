import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PublicProjectsTable } from "@/components/public-projects-table"

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" /> {/* Title */}
              <Skeleton className="h-4 w-96" /> {/* Description */}
            </div>
            <Skeleton className="h-10 w-32" /> {/* Action button */}
          </div>
          
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Filters skeleton */}
      <Card className="p-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
      </Card>

      {/* Projects table will handle its own skeleton state */}
      <PublicProjectsTable
        projects={[]}
        currentPage={1}
        totalPages={1}
        onPageChange={() => {}}
        isLoading={true}
      />
    </div>
  )
} 