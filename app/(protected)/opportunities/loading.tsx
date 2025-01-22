import { Skeleton } from "@/components/ui/skeleton"

export default function OpportunitiesLoading() {
  return (
    <div className="relative size-full">
      {/* Loading overlay */}
      <div className="absolute inset-0 z-50">
        <div className="size-full bg-background/80 backdrop-blur-sm">
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2">
              <Skeleton className="size-10" />
              <Skeleton className="size-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 