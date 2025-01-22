"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MapPin, Calendar, ArrowRight } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/contacts/data-table"
import { useRouter } from "next/navigation"
import Image from 'next/image'
import { format } from "date-fns"

interface Project {
  _id: string
  type: string
  data: {
    id: string
    projectType: string
    project: {
      category: {
        title: string
        description: string
      }
      location: {
        address: string
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
      address: {
        city: string
        unit?: string
        state: string
        street: string
        country: string
        postalCode: string
      }
      company: {
        name: string
        title: string
      }
    }
    metadata: {
      submittedAt: string
      locale: string
      source: string
      version: string
    }
  }
  status: string
  lastStatusChange: {
    from: string
    to: string
    changedBy: string
    changedAt: string
  }
  statusHistory: Array<{
    from: string
    to: string
    changedBy: string
    changedAt: string
  }>
}

interface OpportunityTableProps {
  opportunities: Project[]
  onClaim: (id: string) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function OpportunityTable({ 
  opportunities, 
  onClaim,
  currentPage,
  totalPages,
  onPageChange
}: OpportunityTableProps) {
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "map",
      header: "Location",
      cell: ({ row }) => {
        const project = row.original
        const { coordinates } = project.data.project.location
        return (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden">
            <Image
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=15&size=200x200&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&markers=color:red%7C${coordinates.lat},${coordinates.lng}`}
              alt="Location preview"
              fill
              className="object-cover"
              unoptimized
            />
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
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            onClick={() => onClaim(row.original._id)}
            className="group/button relative overflow-hidden bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              Claim Project
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/button:translate-x-1" />
            </span>
          </Button>
        )
      }
    }
  ]

  return (
    <DataTable 
      columns={columns} 
      data={opportunities}
      pageCount={totalPages}
      onPaginationChange={(updater) => {
        const newState = typeof updater === 'function' 
          ? updater({ pageIndex: currentPage - 1, pageSize: 15 })
          : updater
        onPageChange(newState.pageIndex + 1)
      }}
      searchPlaceholder="Search by description..."
      searchColumn="description"
      pagination={{
        pageIndex: currentPage - 1,
        pageSize: 15
      }}
    />
  )
} 