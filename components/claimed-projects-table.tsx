"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MapPin, Calendar, Phone, Mail, User, UserPlus } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/contacts/data-table"
import { toast } from "sonner"
import { getAccessToken } from '@/src/utils/tokenManager'
import { useRouter } from 'next/navigation'

function ToastLink({ href, children }: { href: string, children: React.ReactNode }) {
  const router = useRouter()
  return (
    <span
      onClick={() => router.push(href)}
      className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
    >
      {children}
    </span>
  )
}

interface Project {
  _id: string
  type: string
  data: {
    project: {
      category: {
        title: string
        description: string
      }
      location: {
        address: {
          street: string
          unit: string
          city: string
          state: string
          country: string
          postalCode: string
        }
        coordinates: {
          lat: number
          lng: number
        }
      }
      details: {
        description: string
      }
    }
    contact: {
      firstName: string
      lastName: string
      email: string
      phones: Array<{
        type: string
        number: string
        primary: boolean
      }>
    }
    metadata: {
      submittedAt: string
      locale: string
      source: string
      version: string
    }
  }
  status: 'public' | 'private'
}

interface ClaimedProjectsTableProps {
  projects: Project[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function ClaimedProjectsTable({ 
  projects, 
  currentPage,
  totalPages,
  onPageChange
}: ClaimedProjectsTableProps) {
  const router = useRouter()
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const formatPhoneNumber = (phones: Array<{ type: string, number: string, primary: boolean }> | undefined) => {
    if (!phones?.length) return null
    const primaryPhone = phones.find(phone => phone.primary) || phones[0]
    return primaryPhone.number
  }

  const formatAddress = (address: {
    street: string
    unit: string
    city: string
    state: string
    country: string
    postalCode: string
  }) => {
    const parts = [
      address.street,
      address.unit && `Unit ${address.unit}`,
      address.city,
      address.state,
      address.country,
      address.postalCode
    ].filter(Boolean)
    return parts.join(', ')
  }

  const handleAddContact = async (project: Project) => {
    try {
      // Log the exact values we're getting
      console.log('Contact values:', {
        firstName: project.data.contact.firstName,
        lastName: project.data.contact.lastName,
        email: project.data.contact.email,
        phones: project.data.contact.phones
      })

      // Create the contact data directly from project.data.contact
      const contactData = {
        email: project.data.contact.email,
        firstName: project.data.contact.firstName,
        lastName: project.data.contact.lastName,
        phones: project.data.contact.phones,
        address: {
          street: project.data.project.location.address.street,
          unit: project.data.project.location.address.unit,
          city: project.data.project.location.address.city,
          state: project.data.project.location.address.state,
          country: "GR",
          postalCode: project.data.project.location.address.postalCode
        },
        opportunityIds: [project._id]
      }

      // Log the exact data we're sending
      console.log('Request body:', JSON.stringify(contactData, null, 2))

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(contactData),
      })

      const responseText = await response.text()
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      console.log('Response body:', responseText)

      if (!response.ok) {
        const errorData = JSON.parse(responseText)
        console.error('Validation error details:', errorData)
        throw new Error(errorData.error || 'Failed to add contact')
      }

      const data = JSON.parse(responseText)
      toast.success(`Successfully added ${project.data.contact.firstName} ${project.data.contact.lastName} to your contacts!`, {
        description: (
          <ToastLink href={`/contacts/${data.id}`}>
            Click here to view contact details
          </ToastLink>
        ),
        duration: 5000
      })
    } catch (error) {
      console.error('Error adding contact:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add contact. Please try again.')
    }
  }

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "map",
      header: "Location",
      cell: ({ row }) => {
        const project = row.original
        const { coordinates } = project.data.project.location
        return (
          <div className="relative h-32 w-48 overflow-hidden rounded-md">
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=15&size=400x300&markers=color:red%7C${coordinates.lat},${coordinates.lng}&key=${googleApiKey}`}
              alt="Project location map"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )
      }
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.data.project.category.title
        return (
          <Badge variant="secondary" className="bg-white/90 text-gray-900 border-none">
            {category}
          </Badge>
        )
      }
    },
    {
      accessorKey: "location",
      header: "Address",
      cell: ({ row }) => {
        const address = row.original.data.project.location.address
        const formattedAddress = formatAddress(address)
        return (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{formattedAddress}</span>
          </div>
        )
      }
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.original.data.project.details.description
        return (
          <p className="text-sm text-gray-900 line-clamp-3">
            {description}
          </p>
        )
      }
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const { firstName, lastName, email, phones } = row.original.data.contact
        const formattedPhone = formatPhoneNumber(phones)

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-900">{`${firstName} ${lastName}`}</span>
            </div>
            {email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <a href={`mailto:${email}`} className="text-sm text-blue-600 hover:text-blue-800">
                  {email}
                </a>
              </div>
            )}
            {formattedPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <a href={`tel:${formattedPhone}`} className="text-sm text-blue-600 hover:text-blue-800">
                  {formattedPhone}
                </a>
              </div>
            )}
            <Button
              onClick={() => handleAddContact(row.original)}
              variant="outline"
              size="sm"
              className="w-full mt-2"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add to Contacts
            </Button>
          </div>
        )
      }
    },
    {
      accessorKey: "date",
      header: "Submitted",
      cell: ({ row }) => {
        const date = new Date(row.original.data.metadata.submittedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{date}</span>
          </div>
        )
      }
    }
  ]

  return (
    <DataTable 
      columns={columns} 
      data={projects}
      pageCount={totalPages}
      onPaginationChange={({ pageIndex }) => {
        onPageChange(pageIndex + 1)
      }}
      searchPlaceholder="Search claimed projects..."
      hideSearch={true}
    />
  )
} 