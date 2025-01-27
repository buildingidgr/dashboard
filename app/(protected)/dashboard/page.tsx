"use client";

import { Card } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { usePublicOpportunities } from "@/hooks/use-public-opportunities"

export default function DashboardPage() {
  const { total, loading, error } = usePublicOpportunities();

  return (
    <div className="container space-y-8 py-8">
      {/* Public Opportunities Stats */}
      <div className="w-full md:w-1/3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-muted p-2">
              <FileText className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Public Opportunities
              </p>
              <div className="flex items-center gap-2">
                {loading ? (
                  <h3 className="text-2xl font-bold">Loading...</h3>
                ) : error ? (
                  <h3 className="text-2xl font-bold text-red-500">Error</h3>
                ) : (
                  <h3 className="text-2xl font-bold">{total}</h3>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}





