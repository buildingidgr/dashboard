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
import { ContactCreateForm } from "@/components/contacts/contact-create-form"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getAccessToken, setAccessToken } from "@/src/utils/tokenManager"
import { useSession, useUser } from "@clerk/nextjs"
import { exchangeClerkToken } from "@/src/services/auth"
import { toast } from "sonner"

export default function NewContactPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const { session } = useSession()
  const { user } = useUser()

  useEffect(() => {
    const initializeToken = async () => {
      if (!session) {
        console.log('No session available, skipping initialization')
        return
      }

      try {
        console.log('Checking token state before initialization...')
        let accessToken = getAccessToken()
        
        if (!accessToken) {
          console.log('No token found, initializing...')
          const tokens = await exchangeClerkToken(session.id, user?.id as string)
          console.log('Token exchange successful')
          setAccessToken(tokens.accessToken, tokens.expiresIn)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize token:', error)
        toast.error('Failed to initialize session')
        setIsLoading(false)
      }
    }

    initializeToken()
  }, [session, user])

  function handleSuccess() {
    toast.success("Contact created successfully")
    router.push('/contacts')
  }

  function handleCancel() {
    router.push('/contacts')
  }

  if (isLoading) {
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
                      <BreadcrumbPage>New Contact</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
                    <BreadcrumbPage>New Contact</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="px-4 sm:px-6 lg:px-8 py-8 bg-white">
              <ProjectHeader 
                title="New Contact"
                description="Create a new contact and add their details"
              />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <ContactCreateForm
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