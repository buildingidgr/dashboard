"use client";

import { Card } from "@/components/ui/card"
import OpportunityTable from "@/components/opportunity-table"
import { Building2, Users, FileText } from "lucide-react"
import { RecentDocuments } from "@/components/recent-documents"

// Sample data - replace with real data fetching
const stats = [
  {
    label: "Total Projects",
    value: "12",
    icon: Building2,
    change: "+2",
  },
  {
    label: "Active Contacts",
    value: "48",
    icon: Users,
    change: "+5",
  },
  {
    label: "Open Opportunities",
    value: "8",
    icon: FileText,
    change: "+1",
  },
]

export default function DashboardPage() {
  return (
    <div className="container py-8 space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-2">
                  <Icon className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <span className="text-sm text-green-500">{stat.change}</span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recent Documents */}
      <RecentDocuments />

      {/* Recent Opportunities */}
      <Card>
        <div className="p-6">
          <h3 className="font-semibold mb-4">Recent Opportunities</h3>
          <OpportunityTable 
            opportunities={[]} 
            currentPage={1}
            totalPages={1}
            onPageChange={() => {}}
            onClaim={() => {}}
          />
        </div>
      </Card>
    </div>
  )
}





