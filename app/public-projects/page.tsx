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
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import GridOpportunities from "@/components/Grid-Opportunities"
import ProjectHeader from "@/components/header"
import ProjectExplain from "@/components/project-explain"

export default function PublicProjectsPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-50">
        <AppSidebar className="fixed top-0 left-0 h-screen" />
        <div className="flex-1">

          {/* Header Section */}
          <header className="bg-white border-b border-gray-200">
            <div className="flex h-16 items-center gap-4 px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Public Projects</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="px-4 py-8 bg-white">
              <ProjectHeader 
                title="Public Projects" 
                description="Discover and claim available projects in your area" 
              />
            </div>
          </header>

          {/* Main Content */}
          <main>
            <div className="px-4 py-8">
              {/* Project Explanation Cards */}
              <div className="mb-12">
                <ProjectExplain />
              </div>

              {/* Projects Grid */}
              <div className="bg-white rounded-lg shadow-sm">
                <GridOpportunities />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
