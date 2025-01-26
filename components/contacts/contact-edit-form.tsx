"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAppToast } from "@/components/layouts/client-layout"
import { getAccessToken } from '@/lib/services/auth'
import { PhoneInput } from "@/components/ui/phone-input"
import { CountryDropdown } from "@/components/ui/country-dropdown"

// Validation schema based on API documentation
const phoneSchema = z.object({
  type: z.enum(["work", "mobile", "home"]),
  number: z.string()
    .regex(/^\+[1-9]\d{7,19}$/, {
      message: "Phone number must be in E.164 format (e.g. +306973359331)"
    }),
  primary: z.boolean()
})

const addressSchema = z.object({
  streetNumber: z.string().min(1).max(20),
  street: z.string().min(1).max(100),
  city: z.string().min(2).max(50),
  area: z.string().min(2).max(50),
  country: z.string().min(2).max(100),
  countryCode: z.string().length(2),
  postalCode: z.string().optional()
}).optional()

const companySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  title: z.string().min(2).max(50).optional(),
  type: z.string().min(2).max(50).optional()
}).refine(
  data => !data?.type || (data?.type && data?.name),
  { message: "Company name is required when type is provided" }
).optional()

const formSchema = z.object({
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters")
    .regex(/^[\p{L}]+$/u, "First name must contain only letters (including Greek)"),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters")
    .regex(/^[\p{L}]+$/u, "Last name must contain only letters (including Greek)"),
  email: z.string()
    .email("Invalid email format")
    .max(100, "Email must be at most 100 characters"),
  phones: z.array(phoneSchema)
    .min(1, "At least one phone number is required")
    .refine(
      phones => phones.filter(p => p.primary).length === 1,
      "Exactly one phone must be primary"
    ),
  address: addressSchema,
  company: companySchema,
  projectIds: z.array(z.string()).optional(),
  opportunityIds: z.array(z.string()).optional(),
  tags: z.array(z.string().min(2).max(20)).max(10).optional()
})

interface ContactEditFormProps {
  contactId: string
  initialData?: z.infer<typeof formSchema>
  onSuccess?: () => void
  onCancel?: () => void
}

// Helper function to format phone number to E.164
function formatToE164(phoneNumber: string | undefined): string {
  if (!phoneNumber) return ''
  // Remove all non-digit characters except the leading +
  return phoneNumber.replace(/[^\d+]/g, '')
}

export function ContactEditForm({ contactId, initialData, onSuccess, onCancel }: ContactEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useAppToast()

  // Transform initial data to ensure no null values
  const sanitizedInitialData = initialData ? {
    ...initialData,
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    phones: initialData.phones.map(phone => ({
      ...phone,
      number: formatToE164(phone.number) || ''
    })),
    address: initialData.address ? {
      streetNumber: initialData.address.streetNumber || '',
      street: initialData.address.street || '',
      city: initialData.address.city || '',
      area: initialData.address.area || '',
      country: initialData.address.country || '',
      countryCode: initialData.address.countryCode || '',
      postalCode: initialData.address.postalCode || ''
    } : undefined,
    company: initialData.company ? {
      name: initialData.company.name || '',
      title: initialData.company.title || '',
      type: initialData.company.type || ''
    } : undefined,
    tags: initialData.tags || []
  } : {
    firstName: '',
    lastName: '',
    email: '',
    phones: [{
      type: "mobile" as const,
      number: '',
      primary: true
    }],
    tags: []
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: sanitizedInitialData
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error("No access token available")
      }

      // Clean up empty optional fields
      const cleanedValues = {
        ...values,
        address: values.address && Object.keys(values.address).length > 0
          ? values.address
          : undefined,
        company: values.company && Object.keys(values.company).filter(key => !!values.company?.[key as keyof typeof values.company]).length > 0
          ? values.company
          : undefined,
        tags: values.tags?.length ? values.tags : undefined,
        projectIds: values.projectIds?.length ? values.projectIds : undefined,
        opportunityIds: values.opportunityIds?.length ? values.opportunityIds : undefined
      }

      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(cleanedValues)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to update contact:', errorData)
        if (response.status === 409) {
          throw new Error(`Email already in use (Contact ID: ${errorData.conflictingContactId})`)
        }
        throw new Error(errorData.message || errorData.error || 'Failed to update contact')
      }

      const data = await response.json()
      console.log('Contact updated successfully:', data)
      onSuccess?.()
    } catch (error: unknown) {
      console.error('Error updating contact:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update contact'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('phones')?.map((_, index) => (
          <div key={index} className="space-y-4">
            <FormField
              control={form.control}
              name={`phones.${index}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select phone type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`phones.${index}.number`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <PhoneInput
                      defaultCountry="GR"
                      value={field.value}
                      onChange={(value) => field.onChange(value || '')}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Select a country code and enter the phone number
                  </p>
                </FormItem>
              )}
            />
          </div>
        ))}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.streetNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.countryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country Code</FormLabel>
                  <FormControl>
                    <CountryDropdown
                      defaultValue={field.value || 'GR'}
                      onChange={(country) => {
                        field.onChange(country.alpha2);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="address.postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="company.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company.title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 