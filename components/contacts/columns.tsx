"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { getAccessToken } from "@/lib/services/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export interface Contact {
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
    streetNumber: string
    street: string
    city: string
    area: string
    country: string
    countryCode: string
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

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export const columns: ColumnDef<Contact, unknown>[] = [
  {
    id: "name",
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/contacts/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.firstName} {row.original.lastName}
      </Link>
    ),
  },
  {
    id: "email",
    accessorFn: (row) => row.email,
    header: "Email",
    cell: ({ row }) => row.getValue("email"),
  },
  {
    id: "phone",
    accessorFn: (row) => {
      const phone = row.phones.find(p => p.primary) || row.phones[0]
      return phone?.number || ''
    },
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.original.phones.find(p => p.primary) || row.original.phones[0]
      return phone ? (
        <div>
          <span>{phone.number}</span>
          <span className="text-sm text-muted-foreground ml-2">({phone.type})</span>
        </div>
      ) : "-"
    },
  },
  {
    id: "company",
    accessorFn: (row) => row.company?.name,
    header: "Company",
    cell: ({ row }) => row.getValue("company") || "-",
  },
  {
    id: "location",
    accessorFn: (row) => row.address ? `${row.address.city}, ${row.address.country}` : '',
    header: "Location",
    cell: ({ row }) => row.getValue("location") || "-",
  },
  {
    id: "createdAt",
    accessorFn: (row) => row.createdAt,
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.getValue("createdAt"))}
      </span>
    ),
  },
  {
    id: "updatedAt",
    accessorFn: (row) => row.updatedAt,
    header: "Updated",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.getValue("updatedAt"))}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <ActionCell row={row} />
    }
  },
]

function ActionCell({ row }: { row: { original: Contact } }) {
  const contact = row.original
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error("No access token available")
      }

      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete contact')
      }

      toast.success("Contact deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete contact')
    } finally {
      setIsLoading(false)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/contacts/${contact.id}`}>View details</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/contacts/${contact.id}/edit`}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleting(true)}
          >
            Delete contact
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {contact.firstName} {contact.lastName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleting(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 