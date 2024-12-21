"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, Mail, User, UserPlus, Calendar, ArrowUpRight } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { getAccessToken } from '@/src/utils/tokenManager'
import { toast } from "sonner"

interface ClaimedProjectCardProps {
  _id: string
  type: string
  data: {
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
      fullName: string
      email: string
      phone: {
        countryCode: string
        number: string
      }
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

export default function ClaimedProjectCard({ _id, data, status }: ClaimedProjectCardProps) {
  const [isAddingContact, setIsAddingContact] = useState(false);

  const handleAddContact = async () => {
    setIsAddingContact(true);
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return;
      }

      const addressString = data.project.location.address;
      if (!addressString || addressString.length < 5) {
        toast.error('Invalid address: Street address is required and must be at least 5 characters');
        return;
      }

      const addressParts = addressString.split(',').map(part => part.trim());
      const street = addressParts[0] || '';
      const city = addressParts[1] || '';
      const postalCodeMatch = addressString.match(/\d{5}/);
      const postalCode = postalCodeMatch ? postalCodeMatch[0] : '';

      const payload = {
        name: data.contact.fullName,
        email: data.contact.email,
        phone: {
          countryCode: data.contact.phone.countryCode,
          number: data.contact.phone.number
        },
        address: {
          street: street,
          city: city,
          state: data.metadata.locale === 'el-GR' ? 'Macedonia' : '',
          country: data.metadata.locale?.split('-')[1] || 'GR',
          postalCode: postalCode
        },
        opportunityIds: [_id]
      };

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        switch (response.status) {
          case 400:
            toast.error('Invalid contact information. Please check the details.');
            break;
          case 401:
            toast.error('Authentication expired. Please log in again.');
            break;
          case 409:
            toast.warning('This contact already exists in your contacts.', {
              description: (
                <a 
                  href={`/contacts/${responseData.existingContactId}`}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Click here to view existing contact
                </a>
              ),
              duration: 5000
            });
            return;
          default:
            toast.error(responseData.error || 'Failed to add contact');
        }
        throw new Error(responseData.error || 'Failed to add contact');
      }

      toast.success(`Successfully added ${data.contact.fullName} to your contacts!`, {
        description: (
          <a 
            href={`/contacts/${responseData.id}`}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Click here to view contact details
          </a>
        ),
        duration: 5000
      });

    } catch (error: unknown) {
      console.error('Error adding contact:', error);
      if (error instanceof Error && !error.message.includes('Failed to add contact')) {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsAddingContact(false);
    }
  };

  if (!data || !data.project) {
    return null;
  }

  const { coordinates } = data.project.location;
  if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
    return null;
  }

  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const submittedDate = new Date(data.metadata.submittedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formatPhoneNumber = (countryCode: string, number: string) => {
    return `+${countryCode} ${number}`;
  };

  return (
    <Card className="group relative overflow-hidden bg-white transition-all duration-300 hover:shadow-lg border border-gray-100">
      <CardContent className="p-0">
        {/* Map Preview */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=15&size=600x300&markers=color:red%7C${coordinates.lat},${coordinates.lng}&key=${googleApiKey}`}
            alt="Project location map"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <Badge 
            className="absolute top-4 left-4 bg-white/90 text-gray-900 border-none"
            variant="secondary"
          >
            {data.project.category.title}
          </Badge>
        </div>

        <div className="p-6">
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{data.project.location.address}</span>
          </div>

          {/* Description */}
          <p className="text-gray-900 line-clamp-3 mb-6">
            {data.project.details.description}
          </p>

          {/* Customer Information */}
          <div className="space-y-3 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 text-sm">Customer Information</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddContact}
                disabled={isAddingContact}
                className="group/button relative overflow-hidden hover:text-blue-600 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isAddingContact ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900/20 border-t-gray-900" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Add Contact</span>
                      <ArrowUpRight className="w-3 h-3 transition-transform duration-300 group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5" />
                    </>
                  )}
                </span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{data.contact.fullName}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{data.contact.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {formatPhoneNumber(data.contact.phone.countryCode, data.contact.phone.number)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{submittedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 