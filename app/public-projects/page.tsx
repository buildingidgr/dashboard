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
      <div className="flex h-screen bg-gray-50">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header Section */}
          <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
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
                    <BreadcrumbPage>Public Projects</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-8 bg-white">
              <div className="max-w-7xl mx-auto">
                <ProjectHeader 
                  title="Public Projects" 
                  description="Discover and claim available projects in your area" 
                />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
