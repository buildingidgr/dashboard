"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Building2, MapPin, Edit, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ContactEditForm } from "./contact-edit-form"
import { toast } from "sonner"
import { getAccessToken } from "@/lib/services/auth"

interface ContactCardProps {
  contact: {
    id: string
    firstName: string
    lastName: string
    email: string
    phones: Array<{
      type: 'work' | 'mobile' | 'home'
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
  onUpdate?: () => void
}

export default function ContactCard({ contact, onUpdate }: ContactCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const primaryPhone = contact.phones.find(phone => phone.primary)

  const handleEditSuccess = () => {
    setIsEditing(false)
    onUpdate?.()
  }

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
      onUpdate?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete contact')
    } finally {
      setIsLoading(false)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Name and Buttons */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  {contact.firstName} {contact.lastName}
                </h3>
                {contact.company?.title && (
                  <p className="text-sm text-gray-500">{contact.company.title}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeleting(true)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              {primaryPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{primaryPhone.number}</span>
                  <Badge variant="outline" className="ml-1 text-xs">
                    {primaryPhone.type}
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{contact.email}</span>
              </div>
              {contact.company?.name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span>{contact.company.name}</span>
                </div>
              )}
              {contact.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>
                    {contact.address.city}, {contact.address.state}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <ContactEditForm
            contactId={contact.id}
            initialData={contact}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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