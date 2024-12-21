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
import { getAccessToken } from "@/src/utils/tokenManager"
import { toast } from "sonner"

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
    street: string
    city: string
    state: string
    country: string
  }
  company?: {
    name: string
  }
  createdAt: string
  updatedAt: string
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

export const columns: ColumnDef<Contact>[] = [
  {
    id: "name",
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: "Name",
    cell: ({ row }) => {
      return (
        <Link
          href={`/contacts/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.firstName} {row.original.lastName}
        </Link>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email,
    enableSorting: true,
  },
  {
    id: "phone",
    accessorFn: (row) => row.phones.find(p => p.primary)?.number || row.phones[0]?.number,
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.original.phones.find(p => p.primary) || row.original.phones[0]
      return phone ? (
        <div>
          <span>{phone.number}</span>
          <span className="text-sm text-muted-foreground ml-2">({phone.type})</span>
        </div>
      ) : null
    },
    enableSorting: true,
  },
  {
    accessorKey: "company.name",
    header: "Company",
    cell: ({ row }) => row.original.company?.name || "-",
  },
  {
    accessorFn: (row) => row.address ? `${row.address.city}, ${row.address.country}` : '',
    header: "Location",
    cell: ({ row }) => {
      return row.original.address ? 
        `${row.original.address.city}, ${row.original.address.country}` : 
        "-"
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.updatedAt)}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const contact = row.original
      const [isDeleting, setIsDeleting] = useState(false)
      const [isLoading, setIsLoading] = useState(false)

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
              'Authorization': `Bearer ${accessToken}`
            }
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || error.error || 'Failed to delete contact')
          }

          toast.success("Contact deleted successfully")
          // Trigger a refresh of the contacts grid
          window.location.reload()
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
    },
  },
] 