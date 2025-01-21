"use client"

import { useEffect, useCallback, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { exchangeClerkToken, getAccessToken, setAccessToken } from "@/lib/services/auth"
import { useSession, useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import Link from "next/link"
import { usePageTitle } from "@/components/layouts/client-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from '@/hooks/use-toast'

// Add country codes mapping
const COUNTRY_CODES: { [key: string]: { code: string, flag: string } } = {
  '+1': { code: 'US', flag: '🇺🇸' },   // United States
  '+44': { code: 'GB', flag: '🇬🇧' },  // United Kingdom
  '+49': { code: 'DE', flag: '🇩🇪' },  // Germany
  '+33': { code: 'FR', flag: '🇫🇷' },  // France
  '+39': { code: 'IT', flag: '🇮🇹' },  // Italy
  '+34': { code: 'ES', flag: '🇪🇸' },  // Spain
  '+351': { code: 'PT', flag: '🇵🇹' }, // Portugal
  '+31': { code: 'NL', flag: '🇳🇱' },  // Netherlands
  '+32': { code: 'BE', flag: '🇧🇪' },  // Belgium
  '+41': { code: 'CH', flag: '🇨🇭' },  // Switzerland
  '+43': { code: 'AT', flag: '🇦🇹' },  // Austria
  '+46': { code: 'SE', flag: '🇸🇪' },  // Sweden
  '+47': { code: 'NO', flag: '🇳🇴' },  // Norway
  '+45': { code: 'DK', flag: '🇩🇰' },  // Denmark
  '+358': { code: 'FI', flag: '🇫🇮' }, // Finland
  '+48': { code: 'PL', flag: '🇵🇱' },  // Poland
  '+420': { code: 'CZ', flag: '🇨🇿' }, // Czech Republic
  '+36': { code: 'HU', flag: '🇭🇺' },  // Hungary
  '+40': { code: 'RO', flag: '🇷🇴' },  // Romania
  '+359': { code: 'BG', flag: '🇧🇬' }, // Bulgaria
  '+30': { code: 'GR', flag: '🇬🇷' },  // Greece
  '+7': { code: 'RU', flag: '🇷🇺' },   // Russia
  '+380': { code: 'UA', flag: '🇺🇦' }, // Ukraine
  '+81': { code: 'JP', flag: '🇯🇵' },  // Japan
  '+86': { code: 'CN', flag: '🇨🇳' },  // China
  '+82': { code: 'KR', flag: '🇰🇷' },  // South Korea
  '+91': { code: 'IN', flag: '🇮🇳' },  // India
  '+61': { code: 'AU', flag: '🇦🇺' },  // Australia
  '+64': { code: 'NZ', flag: '🇳🇿' },  // New Zealand
  '+55': { code: 'BR', flag: '🇧🇷' },  // Brazil
  '+52': { code: 'MX', flag: '🇲🇽' },  // Mexico
  '+54': { code: 'AR', flag: '🇦🇷' },  // Argentina
  '+56': { code: 'CL', flag: '🇨🇱' },  // Chile
  '+57': { code: 'CO', flag: '🇨🇴' },  // Colombia
  '+51': { code: 'PE', flag: '🇵🇪' },  // Peru
  '+58': { code: 'VE', flag: '🇻🇪' },  // Venezuela
  '+20': { code: 'EG', flag: '🇪🇬' },  // Egypt
  '+27': { code: 'ZA', flag: '🇿🇦' },  // South Africa
  '+234': { code: 'NG', flag: '🇳🇬' }, // Nigeria
  '+254': { code: 'KE', flag: '🇰🇪' }, // Kenya
  '+971': { code: 'AE', flag: '🇦🇪' }, // UAE
  '+972': { code: 'IL', flag: '🇮🇱' }, // Israel
  '+966': { code: 'SA', flag: '🇸🇦' }, // Saudi Arabia
  '+90': { code: 'TR', flag: '🇹🇷' },  // Turkey
};

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
  const params = useParams<{ id: string }>()
  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { session } = useSession()
  const { user } = useUser()
  const { setTitle, setDescription } = usePageTitle()
  const router = useRouter()
  const { toast } = useToast()

  const fetchContact = useCallback(async (id: string) => {
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error("Authentication required")
      }

      if (!id) {
        throw new Error("Contact ID is required")
      }

      const response = await fetch(`/api/contacts/${id}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to fetch contact")
      }

      const data = await response.json()
      setContact(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching contact:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch contact",
        variant: "destructive"
      })
      setError(error instanceof Error ? error.message : "Failed to fetch contact")
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    const id = params?.id;
    if (id && typeof id === 'string') {
      fetchContact(id);
    }
  }, [params?.id, fetchContact]);

  useEffect(() => {
    async function initializeTokenAndFetch() {
      try {
        const id = params?.id;
        if (!id || typeof id !== 'string') {
          throw new Error('Invalid contact ID');
        }

        if (!session?.id || !user?.id) {
          throw new Error('Authentication required');
        }

        const tokens = await exchangeClerkToken(session.id, user.id);
        if (tokens.access_token) {
          setAccessToken(tokens.access_token);
          await fetchContact(id);
        }
      } catch (error) {
        console.error('Failed to initialize token:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize session',
          variant: 'destructive'
        });
        setError('Failed to initialize session');
        setIsLoading(false);
      }
    }

    initializeTokenAndFetch();
  }, [params?.id, fetchContact, toast, session?.id, user?.id]);

  useEffect(() => {
    if (contact) {
      setTitle(`${contact.firstName} ${contact.lastName}`)
      setDescription(contact.company?.title || "Contact Details")
    }
  }, [contact, setTitle, setDescription])

  const getCountryFlag = (phoneNumber: string) => {
    // Remove any spaces, dashes, or parentheses
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Try to match the country code
    for (const prefix of Object.keys(COUNTRY_CODES).sort((a, b) => b.length - a.length)) {
      if (cleanNumber.startsWith(prefix)) {
        return COUNTRY_CODES[prefix].flag;
      }
    }
    
    // Default flag if no match is found
    return '🌍';
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header Skeleton */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-12 w-12 rounded-full" /> {/* Flag skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" /> {/* Back button skeleton */}
              <Skeleton className="h-10 w-24" /> {/* Edit button skeleton */}
            </div>
          </div>
          <Skeleton className="h-14 w-2/3" /> {/* Name skeleton */}
        </div>

        {/* Properties Skeleton */}
        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-start gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-[60%]" />
          </div>

          {/* Location */}
          <div className="flex items-start gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-[75%]" />
          </div>

          {/* Phone */}
          <div className="flex items-start gap-4">
            <Skeleton className="h-6 w-24" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-[40%]" />
              <Skeleton className="h-6 w-[35%]" />
            </div>
          </div>

          {/* Updated */}
          <div className="flex items-start gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-[30%]" />
          </div>

          {/* Company */}
          <div className="flex items-start gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-[45%]" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center justify-center h-32 space-y-4">
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

  const getFullAddress = () => {
    if (!contact.address) return null;
    const parts = [
      contact.address.street,
      contact.address.unit,
      contact.address.city,
      contact.address.state,
      contact.address.country,
      contact.address.postalCode
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="text-3xl">
            {contact.phones.length > 0 
              ? getCountryFlag(contact.phones[0].number)
              : '🌍'
            }
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => router.push(`/contacts/${contact.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
        <h1 className="text-5xl font-bold text-gray-800">{contact.firstName} {contact.lastName}</h1>
      </div>

      {/* Properties */}
      <div className="space-y-4">
        <div className="flex items-start gap-4 group">
          <div className="w-24 flex items-center gap-2 text-gray-500">
            Email
          </div>
          <div className="flex-1">
            <a href={`mailto:${contact.email}`} className="hover:underline">
              {contact.email}
            </a>
          </div>
        </div>

        {contact.address && (
          <div className="flex items-start gap-4 group">
            <div className="w-24 flex items-center gap-2 text-gray-500">
              Location
            </div>
            <div className="flex-1">{getFullAddress()}</div>
          </div>
        )}

        {contact.phones.length > 0 && (
          <div className="flex items-start gap-4 group">
            <div className="w-24 flex items-center gap-2 text-gray-500">
              Phone
            </div>
            <div className="flex-1">
              {contact.phones.map((phone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <a href={`tel:${phone.number}`} className="hover:underline">
                    {phone.number}
                  </a>
                  {phone.type && (
                    <span className="text-sm text-gray-500">({phone.type})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-4 group">
          <div className="w-24 flex items-center gap-2 text-gray-500">
            Updated
          </div>
          <div className="flex-1">
            {new Date(contact.updatedAt).toLocaleString()}
          </div>
        </div>

        <div className="flex items-start gap-4 group">
          <div className="w-24 flex items-center gap-2 text-gray-500">
            Company
          </div>
          <div className="flex-1 text-gray-400">
            {contact.company?.name || 'Empty'}
            {contact.company?.title && (
              <span className="text-sm text-gray-500 ml-2">({contact.company.title})</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 