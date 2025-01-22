import { Skeleton } from "@/components/ui/skeleton"

export default function OpportunityDetailsLoading() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-16">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="size-6 w-24" />
            <Skeleton className="size-6 w-32" />
          </div>
          <Skeleton className="size-8 w-96" />
        </div>
        <Skeleton className="size-10 w-24" />
      </div>

      {/* Map Skeleton */}
      <Skeleton className="w-full h-[400px] rounded-lg" />

      {/* Details Skeleton */}
      <div className="space-y-6">
        {/* Location */}
        <div className="flex gap-4">
          <Skeleton className="size-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="size-5 w-24" />
            <Skeleton className="size-4 w-full" />
            <Skeleton className="size-4 w-3/4" />
            <Skeleton className="size-4 w-1/2" />
          </div>
        </div>

        {/* Contact */}
        <div className="flex gap-4">
          <Skeleton className="size-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="size-5 w-20" />
            <Skeleton className="size-4 w-48" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 w-4" />
                <Skeleton className="size-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 w-4" />
                <Skeleton className="size-4 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <Skeleton className="size-4 w-48" />
      </div>
    </div>
  )
} 