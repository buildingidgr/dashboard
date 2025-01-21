import { Skeleton } from "@/components/ui/skeleton"

export default function OpportunitiesLoading() {
  return (
    <div className="w-full h-full space-y-4 p-8">
      {/* Map container skeleton */}
      <div className="w-full aspect-[16/9] rounded-lg overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      
      {/* Controls skeleton */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
      </div>
      
      {/* Legend skeleton */}
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[180px]" />
      </div>
    </div>
  )
} 