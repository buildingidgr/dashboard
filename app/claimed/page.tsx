import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import ProjectHeader from "@/components/header"
import PaginatedProjects from '@/components/paginated-projects'
import { Card } from "@/components/ui/card"
import { Building2, Phone, Mail, UserPlus } from 'lucide-react'

const stats = [
  {
    icon: Building2,
    label: "Total Projects",
    value: "View all your claimed projects",
    color: "text-blue-600"
  },
  {
    icon: Phone,
    label: "Direct Contact",
    value: "Access customer information",
    color: "text-green-600"
  },
  {
    icon: UserPlus,
    label: "Add to Contacts",
    value: "Save contacts for future reference",
    color: "text-purple-600"
  }
]

export default function ClaimedProjectsPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AppSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen">
          {/* Fixed Header */}
          <header className="z-10 bg-white border-b border-gray-200">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Claimed Projects</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-8 bg-white">
              <div className="max-w-7xl mx-auto">
                <ProjectHeader 
                  title="Claimed Projects" 
                  description="Manage and track your claimed projects" 
                />
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {stats.map((stat, index) => (
                  <Card 
                    key={index}
                    className="p-6 bg-white hover:shadow-lg transition-all duration-300 border-none"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{stat.label}</p>
                        <p className="text-sm text-gray-600 mt-1">{stat.value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Projects List */}
              <div className="bg-white rounded-lg shadow-sm">
                <PaginatedProjects />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}