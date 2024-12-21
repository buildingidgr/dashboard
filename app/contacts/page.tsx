"use client"

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
import ContactsGrid from "@/components/contacts/contacts-grid"
import ProjectHeader from "@/components/header"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link"

export default function ContactsPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
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
                    <BreadcrumbPage>Contacts</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="px-4 sm:px-6 lg:px-8 py-8 bg-white">
              <div className="flex justify-between items-center">
                <ProjectHeader 
                  title="Contacts"
                  description="Manage and organize your contacts"
                />
                <Button asChild>
                  <Link href="/contacts/new">
                    <UserPlus className="mr-2 h-4 w-4" />
                    New Contact
                  </Link>
                </Button>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              <ContactsGrid />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
} 