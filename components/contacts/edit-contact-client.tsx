"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ContactEditForm } from "@/components/contacts/contact-edit-form"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getAccessToken } from "@/lib/services/auth"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { usePageTitle } from "@/components/layouts/client-layout"

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phones: Array<{
    type: "work" | "mobile" | "home"
    number: string
    primary: boolean
  }>
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
  tags: string[]
}

interface EditContactClientProps {
  id: string
}

export function EditContactClient({ id }: EditContactClientProps) {
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { setTitle, setDescription } = usePageTitle()

  useEffect(() => {
    async function fetchContact() {
      try {
        const accessToken = getAccessToken()
        if (!accessToken) {
          throw new Error("No access token available")
        }

        const response = await fetch(`/api/contacts/${id}`, {
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
      } finally {
        setIsLoading(false)
      }
    }

    fetchContact()
  }, [id])

  // Update title when contact data changes
  useEffect(() => {
    if (contact) {
      setTitle(`Edit Contact: ${contact.firstName} ${contact.lastName}`)
      setDescription("Update contact information and details")
    } else {
      setTitle("Edit Contact")
      setDescription("Loading contact details...")
    }
  }, [contact, setTitle, setDescription])

  const handleSuccess = () => {
    toast.success("Contact updated successfully")
    router.push(`/contacts/${id}`)
  }

  const handleCancel = () => {
    router.push('/contacts')
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        {/* Back Button Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" /> {/* Label */}
                <Skeleton className="h-10 w-full" /> {/* Input */}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" /> {/* Label */}
                <Skeleton className="h-10 w-full" /> {/* Input */}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-16" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>

            {/* Phone Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" /> {/* Label */}
                <Skeleton className="h-10 w-40" /> {/* Select */}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" /> {/* Label */}
                <Skeleton className="h-10 w-full" /> {/* Phone Input */}
                <Skeleton className="h-4 w-72" /> {/* Help Text */}
              </div>
            </div>

            {/* Address Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" /> {/* Label */}
                <Skeleton className="h-10 w-full" /> {/* Street */}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-16" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* City */}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-16" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* State */}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Country */}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Postal Code */}
                </div>
              </div>
            </div>

            {/* Company Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" /> {/* Label */}
                <Skeleton className="h-10 w-full" /> {/* Company Name */}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Title */}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Type */}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Skeleton className="h-10 w-24" /> {/* Cancel Button */}
              <Skeleton className="h-10 w-24" /> {/* Save Button */}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <h1 className="text-2xl font-bold">Contact Not Found</h1>
          <p className="text-muted-foreground">The requested contact could not be found.</p>
          <Button variant="outline" asChild>
            <Link href="/contacts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contacts
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <Link href="/contacts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contacts
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <ContactEditForm
            contactId={id}
            initialData={contact}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  )
} 