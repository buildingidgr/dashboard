"use client"

import { useEffect, useCallback, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { exchangeClerkToken, getAccessToken, setAccessToken } from "@/lib/services/auth"
import { useUser, useSession } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Mail, Phone, Building2, Calendar, Tag, Link as LinkIcon, MapPin } from "lucide-react"
import Link from "next/link"
import { usePageTitle } from "@/components/layouts/client-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

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
  phones: Array<{
    type: "work" | "mobile" | "home"
    number: string
    primary: boolean
  }>
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

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-16">
      {/* Header Skeleton */}
      <div className="mb-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Skeleton className="h-14 w-2/3" />
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ContactDetailsPage() {
  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()
  const params = useParams()
  const { user } = useUser()
  const { session } = useSession()
  const { setTitle, setDescription } = usePageTitle()
  const router = useRouter()

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
      setError(error instanceof Error ? error : new Error("Failed to fetch contact"))
    } finally {
      setIsLoading(false)
    }
  }, [])

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
        setError(error instanceof Error ? error : new Error('Failed to initialize session'));
        setIsLoading(false);
      }
    }

    initializeTokenAndFetch();
  }, [params?.id, fetchContact, session?.id, user?.id]);

  useEffect(() => {
    if (contact) {
      setTitle(`${contact.firstName} ${contact.lastName}`)
      setDescription("Contact Details")
    }
  }, [contact, setTitle, setDescription])

  if (isLoading) {
    return <PageSkeleton />
  }

  if (error || !contact) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-16">
        <div className="flex h-32 flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-bold">Contact Not Found</h1>
          <p className="text-muted-foreground">The requested contact could not be found.</p>
          <Button variant="outline" className="flex items-center gap-2" asChild>
            <Link href="/contacts">
              <ArrowLeft className="h-4 w-4" />
              Back to Contacts
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-[1200px] py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/contacts" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Contacts
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/contacts/${contact.id}/edit`} className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit Contact
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <Card className="overflow-hidden">
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-semibold">
                  {contact.firstName} {contact.lastName}
                </h1>
                {contact.company?.title && (
                  <p className="text-muted-foreground mt-1">
                    {contact.company.title}
                  </p>
                )}
              </div>

              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <a href={`mailto:${contact.email}`} className="text-sm font-medium hover:underline">
                      {contact.email}
                    </a>
                    <p className="text-xs text-muted-foreground">Email</p>
                  </div>
                </div>

                {contact.phones.map((phone, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                      <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <a href={`tel:${phone.number}`} className="text-sm font-medium hover:underline">
                        {phone.number}
                      </a>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground capitalize">{phone.type}</p>
                        {phone.primary && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {contact.address && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {contact.address.streetNumber} {contact.address.street}
                      </p>
                      <p className="text-sm">
                        {contact.address.city}, {contact.address.area} {contact.address.postalCode}
                      </p>
                      <p className="text-xs text-muted-foreground">{contact.address.country}</p>
                    </div>
                  </div>
                )}

                {contact.company?.name && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{contact.company.name}</p>
                      <p className="text-xs text-muted-foreground">Company</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Linked Items Card */}
          <Card className="overflow-hidden">
            <div className="p-6 space-y-4">
              <h3 className="font-medium">Linked Items</h3>
              <div className="space-y-4">
                {contact.opportunityIds.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                      <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {contact.opportunityIds.length} Linked Opportunit{contact.opportunityIds.length === 1 ? 'y' : 'ies'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {contact.opportunityIds.map((id) => (
                          <Button
                            key={id}
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-7 text-xs"
                          >
                            <Link href={`/opportunities/${id}`}>
                              View Opportunity
                            </Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags Card */}
          {contact.tags.length > 0 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <h3 className="font-medium">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Metadata Card */}
          <Card className="p-6 space-y-4">
            <h3 className="font-medium">Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(contact.createdAt), 'PPp')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(contact.updatedAt), 'PPp')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 