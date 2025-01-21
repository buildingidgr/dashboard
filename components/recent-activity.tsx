"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  UserPlus, 
  FileEdit, 
  CheckCircle2,
  Clock
} from "lucide-react"

// This is sample data - replace with real data fetching
const activities = [
  {
    id: 1,
    type: 'new_contact',
    description: 'Added new contact John Doe',
    timestamp: '2 hours ago',
    icon: UserPlus
  },
  {
    id: 2,
    type: 'project_update',
    description: 'Updated Project ABC details',
    timestamp: '4 hours ago',
    icon: FileEdit
  },
  {
    id: 3,
    type: 'project_claimed',
    description: 'Claimed Project XYZ',
    timestamp: '1 day ago',
    icon: CheckCircle2
  }
]

export function RecentActivity() {
  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon
          return (
            <div key={activity.id} className="flex items-start gap-4">
              <div className="mt-1">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm">{activity.description}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {activity.timestamp}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
} 