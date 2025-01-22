"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { exchangeClerkToken, getAccessToken, setAccessToken } from "@/lib/services/auth"
import { Phone, Mail, MapPin, Building, Plus, Trash2, ArrowLeft } from "lucide-react"
import { useSession, useUser } from "@clerk/nextjs"
import { usePageTitle } from "@/components/layouts/client-layout"
import Link from "next/link"
import { CountryDropdown } from "@/components/ui/country-dropdown"

interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phones: Array<{
    type: 'mobile' | 'work' | 'home'
    number: string
    primary: boolean
  }>
  address?: {
    street: string
    unit: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  opportunityIds: string[]
}

interface ParsedPhoneData {
  type: string;
  number: string;
  primary: boolean;
}

export default function NewContactPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const { session } = useSession()
  const { user } = useUser()
  const { setTitle, setDescription } = usePageTitle()

  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phones: [{ type: "mobile" as const, number: "", primary: true }],
    opportunityIds: []
  })

  useEffect(() => {
    setTitle("New Contact")
    setDescription("Create a new contact and add their details")
  }, [setTitle, setDescription])

  useEffect(() => {
    const initializeToken = async () => {
      if (!session) {
        console.log('No session available, skipping initialization')
        return
      }

      try {
        console.log('Checking token state before initialization...')
        const accessToken = getAccessToken()
        
        if (!accessToken) {
          console.log('No token found, initializing...')
          const tokens = await exchangeClerkToken(session.id, user?.id as string)
          console.log('Token exchange successful')
          setAccessToken(tokens.access_token)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize token:', error)
        toast.error('Failed to initialize session')
        setIsLoading(false)
      }
    }

    initializeToken()
  }, [session, user])

  useEffect(() => {
    const data = searchParams?.get("data")
    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data))
        const phones = parsedData.phones?.map((phone: ParsedPhoneData) => ({
          type: phone.type === 'work' || phone.type === 'home' ? phone.type : 'mobile',
          number: phone.number || '',
          primary: phone.primary || false
        })) || [{ type: "mobile" as const, number: "", primary: true }]
        
        setFormData({
          firstName: parsedData.firstName || "",
          lastName: parsedData.lastName || "",
          email: parsedData.email || "",
          phones,
          opportunityIds: parsedData.opportunityIds || [],
          ...(parsedData.address ? {
            address: {
              street: parsedData.address.street || "",
              unit: parsedData.address.unit || "",
              city: parsedData.address.city || "",
              state: parsedData.address.state || "",
              country: parsedData.address.country || "GR",
              postalCode: parsedData.address.postalCode || ""
            }
          } : {})
        })
      } catch (error) {
        console.error("Failed to parse contact data:", error)
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = getAccessToken()
      if (!token) throw new Error("No access token available")

      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create contact")
      }

      toast.success("Contact created successfully")
      router.push("/contacts")
    } catch (error) {
      console.error("Failed to create contact:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create contact")
    } finally {
      setIsLoading(false)
    }
  }

  const addPhone = () => {
    setFormData(prev => ({
      ...prev,
      phones: [...prev.phones, { type: "mobile" as const, number: "", primary: false }]
    }))
  }

  const removePhone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index)
    }))
  }

  const updatePhone = (index: number, field: 'type' | 'number' | 'primary', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      phones: prev.phones.map((phone, i) => 
        i === index 
          ? { ...phone, [field]: value }
          : phone
      )
    }))
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full size-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <Link href="/contacts">
            <ArrowLeft className="size-4 mr-2" />
            Back to Contacts
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <Building className="size-5" />
            Basic Information
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john.doe@example.com"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Phone Numbers Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <Phone className="size-5" />
            Phone Numbers
          </div>
          
          {formData.phones.map((phone, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`phone-${index}`}>
                  Phone Number {index + 1}
                  {index === 0 && " (Primary)"}
                </Label>
                <div className="flex items-center gap-2">
                  <select
                    value={phone.type}
                    onChange={(e) => updatePhone(index, 'type', e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="mobile">Mobile</option>
                    <option value="work">Work</option>
                    <option value="home">Home</option>
                  </select>
                  <Input
                    id={`phone-${index}`}
                    value={phone.number}
                    onChange={(e) => updatePhone(index, 'number', e.target.value)}
                    placeholder="+1 234 567 890"
                    className="flex-1"
                  />
                </div>
              </div>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePhone(index)}
                  className="mt-8"
                >
                  <Trash2 className="size-5" />
                </Button>
              )}
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addPhone}
            className="w-full"
          >
            <Plus className="size-4" />
            Add Phone Number
          </Button>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <MapPin className="size-4" />
            Address
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.address?.street || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: {
                    ...(prev.address || {
                      unit: "",
                      city: "",
                      state: "",
                      country: "GR",
                      postalCode: ""
                    }),
                    street: e.target.value
                  }
                }))}
                placeholder="123 Main St"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit/Suite/Apartment</Label>
              <Input
                id="unit"
                value={formData.address?.unit || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: {
                    ...(prev.address || {
                      street: "",
                      city: "",
                      state: "",
                      country: "GR",
                      postalCode: ""
                    }),
                    unit: e.target.value
                  }
                }))}
                placeholder="Apt 4B"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address?.city || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: {
                      ...(prev.address || {
                        street: "",
                        unit: "",
                        state: "",
                        country: "GR",
                        postalCode: ""
                      }),
                      city: e.target.value
                    }
                  }))}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.address?.state || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: {
                      ...(prev.address || {
                        street: "",
                        unit: "",
                        city: "",
                        country: "GR",
                        postalCode: ""
                      }),
                      state: e.target.value
                    }
                  }))}
                  placeholder="NY"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <CountryDropdown
                  defaultValue={formData.address?.country || "GR"}
                  onChange={(country) => setFormData(prev => ({
                    ...prev,
                    address: {
                      ...(prev.address || {
                        street: "",
                        unit: "",
                        city: "",
                        state: "",
                        postalCode: ""
                      }),
                      country: country.alpha2
                    }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.address?.postalCode || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: {
                      ...(prev.address || {
                        street: "",
                        unit: "",
                        city: "",
                        state: "",
                        country: "GR"
                      }),
                      postalCode: e.target.value
                    }
                  }))}
                  placeholder="10001"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push('/contacts')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Contact"}
          </Button>
        </div>
      </form>
    </div>
  )
} 