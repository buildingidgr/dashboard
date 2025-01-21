"use client";

import { Card } from "@/components/ui/card"
import { RecentActivity } from "@/components/recent-activity"
import OpportunityTable from "@/components/opportunity-table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
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

const chartData = [
  { name: "Jan", value: 12 },
  { name: "Feb", value: 15 },
  { name: "Mar", value: 18 },
  { name: "Apr", value: 14 },
  { name: "May", value: 22 },
  { name: "Jun", value: 24 },
]

export default function DashboardPage() {
  const chartConfig = {
    value: {
      label: "Projects",
      theme: {
        light: "hsl(var(--primary))",
        dark: "hsl(var(--primary))",
      },
    },
  }

  return (
    <div className="container space-y-8 py-8">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-2">
                  <Icon className="h-6 w-6" />
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

      <div className="grid gap-8 md:grid-cols-2">
        {/* Activity Feed */}
        <Card className="col-span-1">
          <div className="p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <RecentActivity />
          </div>
        </Card>

        {/* Chart */}
        <Card className="col-span-1">
          <div className="p-6">
            <h3 className="font-semibold mb-4">Project Growth</h3>
            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar
                      dataKey="value"
                      fill="currentColor"
                      className="fill-primary"
                      radius={[4, 4, 0, 0]}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload) return null
                        return (
                          <ChartTooltipContent
                            active={active}
                            payload={payload}
                            label={payload[0]?.payload.name}
                          />
                        )
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </Card>
      </div>

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





