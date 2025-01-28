'use client';

import { DocumentsTable } from "@/components/documents/documents-table";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsPage() {
  const { toast } = useToast();
  const { isLoaded: isSessionLoaded } = useSession();

  if (!isSessionLoaded) {
    return (
      <div className="flex-1 flex-col p-8 md:flex space-y-4">
        {/* Create Button Skeleton */}
        <div className="flex justify-end mb-4">
          <Skeleton className="h-10 w-[140px]" />
        </div>

        {/* Table Skeleton */}
        <div className="rounded-md border">
          <div className="border-b">
            <div className="grid grid-cols-4 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="divide-y">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-4 p-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between px-2">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex-col p-8 md:flex">
      <DocumentsTable />
    </div>
  );
} 