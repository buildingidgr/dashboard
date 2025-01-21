import { Skeleton } from "@/components/ui/skeleton"

export default function OpportunityDetailsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-96" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Map Skeleton */}
      <Skeleton className="w-full h-[400px] rounded-lg" />

      {/* Details Skeleton */}
      <div className="space-y-6">
        {/* Location */}
        <div className="flex gap-4">
          <Skeleton className="h-5 w-5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        {/* Contact */}
        <div className="flex gap-4">
          <Skeleton className="h-5 w-5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-48" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  )
} 