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
const _COUNTRY_CODES: { [key: string]: { code: string, flag: string } } = {
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
    <div className="px-4 py-16 mx-auto max-w-[1200px] space-y-8">
      {/* Header Skeleton */}
      <div className="mb-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="w-24 h-10" />
          <div className="flex gap-2">
            <Skeleton className="w-24 h-10" />
            <Skeleton className="w-24 h-10" />
          </div>
        </div>
        <Skeleton className="w-2/3 h-14" />
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="p-6 space-y-4">
              <Skeleton className="w-32 h-6" />
              <div className="space-y-2">
                <Skeleton className="w-full h-5" />
                <Skeleton className="w-3/4 h-5" />
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <Skeleton className="w-32 h-6" />
              <div className="space-y-2">
                <Skeleton className="w-full h-5" />
                <Skeleton className="w-3/4 h-5" />
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
  const { toast: _toast } = useToast()
  const params = useParams()
  const { user } = useUser()
  const { session } = useSession()
  const { setTitle, setDescription } = usePageTitle()
  const _router = useRouter()

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
      <div className="px-4 py-16 mx-auto max-w-[1200px] space-y-8">
        <div className="flex flex-col items-center justify-center h-32 space-y-4">
          <h1 className="text-2xl font-bold">Contact Not Found</h1>
          <p className="text-muted-foreground">The requested contact could not be found.</p>
          <Button variant="outline" className="flex items-center gap-2" asChild>
            <Link href="/contacts">
              <ArrowLeft className="size-4" />
              Back to Contacts
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contacts">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Back to Contacts</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{contact.firstName} {contact.lastName}</h1>
            {contact.company?.title && (
              <p className="text-muted-foreground">{contact.company.title} at {contact.company.name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/contacts/${contact.id}/edit`}>
              <Pencil className="size-4" />
              <span className="sr-only">Edit Contact</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Information */}
          <Card>
            <div className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Contact Information</h2>
              <div className="space-y-4">
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <a href={`mailto:${contact.email}`} className="text-sm hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phones.map((phone, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <a href={`tel:${phone.number}`} className="text-sm hover:underline">
                        {phone.number}
                      </a>
                      <Badge variant="secondary" className="text-xs">
                        {phone.type}
                      </Badge>
                      {phone.primary && (
                        <Badge variant="outline" className="text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {contact.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span className="text-sm">{contact.company.name}</span>
                  </div>
                )}
                {contact.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 mt-0.5 text-muted-foreground" />
                    <div className="text-sm">
                      <div>{contact.address.streetNumber} {contact.address.street}</div>
                      <div>{contact.address.city}, {contact.address.area} {contact.address.postalCode}</div>
                      <div>{contact.address.country}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Projects */}
          {contact.projectIds.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Projects</h2>
                  <LinkIcon className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  {contact.projectIds.map((projectId) => (
                    <Button key={projectId} variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/projects/${projectId}`}>
                        Project {projectId}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          {contact.tags.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Tags</h2>
                  <Tag className="size-4 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Details</h2>
                <Calendar className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div>{format(new Date(contact.createdAt), "PPP")}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Updated</div>
                  <div>{format(new Date(contact.updatedAt), "PPP")}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 