"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getAccessToken, setAccessToken } from "@/src/utils/tokenManager"
import { exchangeClerkToken } from "@/src/services/auth"
import { useSession, useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Building2, MapPin, Briefcase, Tag, Calendar, User, Pencil, ArrowLeft } from "lucide-react"
import Link from "next/link"
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

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phones: {
    type: string
    number: string
    primary: boolean
  }[]
  address?: {
    street: string
    unit?: string
    city: string
    state: string
    country: string
    postalCode?: string
  }
  company?: {
    name: string
    title?: string
    type?: string
  }
  projectIds: string[]
  opportunityIds: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

export default function ContactDetailsPage() {
  const params = useParams()
  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { session } = useSession()
  const { user } = useUser()

  useEffect(() => {
    const initializeTokenAndFetch = async () => {
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
          accessToken = tokens.accessToken
        }

        if (accessToken) {
          await fetchContact()
        }
      } catch (error) {
        console.error('Failed to initialize token:', error)
        toast.error('Failed to initialize session')
        setError('Failed to initialize session')
        setIsLoading(false)
      }
    }

    initializeTokenAndFetch()
  }, [session, user])

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
      setError(null)
    } catch (error) {
      console.error('Error fetching contact:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch contact')
      toast.error(error instanceof Error ? error.message : 'Failed to fetch contact')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
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
                <Button variant="outline" asChild>
                  <Link href="/contacts">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Contacts
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
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
                <Button variant="outline" asChild>
                  <Link href="/contacts">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Contacts
                  </Link>
                </Button>
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
                    <BreadcrumbPage>{contact.firstName} {contact.lastName}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="px-4 sm:px-6 lg:px-8 py-8 bg-white">
              <div className="flex justify-between items-center">
                <ProjectHeader 
                  title={`${contact.firstName} ${contact.lastName}`}
                  description="Contact details and information"
                />
                <Button asChild>
                  <Link href={`/contacts/${contact.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Contact
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{contact.firstName} {contact.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{contact.email}</span>
                  </div>
                  {contact.phones.map((phone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{phone.number}</span>
                      <span className="text-sm text-muted-foreground">({phone.type}){phone.primary && " - Primary"}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Company Information */}
              {contact.company && (
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{contact.company.name}</span>
                    </div>
                    {contact.company.title && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{contact.company.title}</span>
                      </div>
                    )}
                    {contact.company.type && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <span>{contact.company.type}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Address */}
              {contact.address && (
                <Card>
                  <CardHeader>
                    <CardTitle>Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1" />
                      <div>
                        <p>{contact.address.street}</p>
                        {contact.address.unit && <p>Unit {contact.address.unit}</p>}
                        <p>{contact.address.city}, {contact.address.state}</p>
                        <p>{contact.address.country}</p>
                        {contact.address.postalCode && <p>{contact.address.postalCode}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">Created: {new Date(contact.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">Updated: {new Date(contact.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
} 