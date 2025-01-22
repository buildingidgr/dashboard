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
    .min(1, "Phone number is required")
    .regex(/^\+?[1-9][0-9\s-()]*$/, {
      message: "Please enter a valid phone number"
    }),
  primary: z.boolean()
})

const addressSchema = z.object({
  street: z.string().min(1, "Street is required").max(100),
  unit: z.string().max(20).optional(),
  city: z.string().min(1, "City is required").max(50),
  state: z.string().min(1, "State is required").max(50),
  country: z.string().min(2).max(2),
  postalCode: z.string().max(20).optional()
}).optional()

const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100),
  title: z.string().max(50).optional(),
  type: z.string().max(50).optional()
}).optional()

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email().max(100),
  phones: z.array(phoneSchema).min(1).refine(
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
      street: initialData.address.street || '',
      unit: initialData.address.unit || '',
      city: initialData.address.city || '',
      state: initialData.address.state || '',
      country: initialData.address.country || 'GR',
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
          ? {
              ...values.address,
              unit: values.address.unit || undefined,
              postalCode: values.address.postalCode || undefined
            }
          : undefined,
        company: values.company && Object.keys(values.company).length > 0
          ? {
              ...values.company,
              title: values.company.title || undefined,
              type: values.company.type || undefined
            }
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
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
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
            <FormField
              control={form.control}
              name="address.postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="XXXXX or XXXXX-XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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