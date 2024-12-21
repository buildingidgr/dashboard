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
import { Card, CardContent } from "@/components/ui/card"
import ProjectHeader from "@/components/header"
import { ContactEditForm } from "@/components/contacts/contact-edit-form"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getAccessToken } from "@/src/utils/tokenManager"
import { toast } from "sonner"

export default function EditContactPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)

  useEffect(() => {
    fetchContact()
  }, [params.id])

  async function fetchContact() {
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error("No access token available")
      }

      const response = await fetch(`/api/contacts/${params.id}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to fetch contact')
      }

      const data = await response.json()
      setContact(data)
    } catch (error) {
      console.error('Error fetching contact:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch contact')
    }
  }

  const handleSuccess = () => {
    toast.success("Contact updated successfully")
    router.push(`/contacts/${params.id}`)
  }

  const handleCancel = () => {
    router.push(`/contacts/${params.id}`)
  }

  if (!contact) {
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
                      <BreadcrumbLink href="/contacts">Contacts</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Not Found</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-5xl mx-auto text-center space-y-4">
                <h1 className="text-2xl font-bold">Contact Not Found</h1>
                <p className="text-gray-600">The requested contact could not be found.</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

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
                    <BreadcrumbLink href="/contacts">Contacts</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/contacts/${contact.id}`}>
                      {contact.firstName} {contact.lastName}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Edit</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="px-4 sm:px-6 lg:px-8 py-8 bg-white">
              <ProjectHeader 
                title={`Edit Contact: ${contact.firstName} ${contact.lastName}`}
                description="Update contact information and details"
              />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <ContactEditForm
                    contactId={params.id}
                    initialData={contact}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
} 