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
import { toast } from "sonner"
import { getAccessToken } from '@/lib/services/auth'
import { PhoneInput } from "@/components/ui/phone-input"
import { CountryDropdown } from "@/components/ui/country-dropdown"
import { User, Mail, Phone, MapPin, Building2, Loader2 } from "lucide-react"
import { Plus, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

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
  street: z.string().min(1).max(100).optional(),
  streetNumber: z.string().min(1).max(20).optional(),
  city: z.string().min(2).max(50).optional(),
  area: z.string().min(2).max(50).optional(),
  country: z.string().min(2).max(100).optional(),
  countryCode: z.string().length(2).optional(),
  postalCode: z.string().optional()
}).optional()
  .refine(
    data => {
      if (!data) return true;
      // If any address field is provided, ensure required fields are present
      const hasAnyField = Object.values(data).some(value => value);
      if (!hasAnyField) return true;
      
      return (!data.street || data.street.length >= 1) &&
             (!data.streetNumber || data.streetNumber.length >= 1) &&
             (!data.city || data.city.length >= 2) &&
             (!data.area || data.area.length >= 2) &&
             (!data.country || data.country.length >= 2) &&
             (!data.countryCode || data.countryCode.length === 2);
    },
    {
      message: "If providing address, please fill in all required fields correctly"
    }
  )

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

  // Transform initial data to ensure no null values and handle optional fields
  const sanitizedInitialData = initialData ? {
    ...initialData,
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    phones: initialData.phones.map(phone => ({
      ...phone,
      number: formatToE164(phone.number) || ''
    })),
    // Only include address if it has actual values
    address: initialData.address ? {
      street: initialData.address.street || undefined,
      streetNumber: initialData.address.streetNumber || undefined,
      city: initialData.address.city || undefined,
      area: initialData.address.area || undefined,
      country: initialData.address.country || undefined,
      countryCode: initialData.address.countryCode || undefined,
      postalCode: initialData.address.postalCode || undefined
    } : undefined,
    company: initialData.company ? {
      name: initialData.company.name || undefined,
      title: initialData.company.title || undefined,
      type: initialData.company.type || undefined
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
    address: undefined,
    company: undefined,
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
      const cleanedValues: Partial<typeof values> = {
        // Required fields always included
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phones: values.phones,
      }

      // Optional fields - only include if they have values
      if (values.address) {
        const addressFields: Record<string, string> = {
          street: values.address.street?.trim() || "",
          streetNumber: values.address.streetNumber?.trim() || "",
          city: values.address.city?.trim() || "",
          area: values.address.area?.trim() || "",
          country: values.address.country?.trim() || "",
          countryCode: values.address.countryCode?.trim() || "",
          postalCode: values.address.postalCode?.trim() || ""
        }

        // Only include address if any field has a value
        if (Object.values(addressFields).some(value => value)) {
          cleanedValues.address = addressFields
        }
      }

      if (values.company) {
        const companyFields: Record<string, string | undefined> = {}
        if (values.company.name?.trim()) companyFields.name = values.company.name.trim()
        if (values.company.title?.trim()) companyFields.title = values.company.title.trim()
        if (values.company.type?.trim()) companyFields.type = values.company.type.trim()

        if (Object.keys(companyFields).length > 0) {
          cleanedValues.company = companyFields
        }
      }

      // Only include arrays if they have items
      if (values.tags?.length) cleanedValues.tags = values.tags
      if (values.projectIds?.length) cleanedValues.projectIds = values.projectIds
      if (values.opportunityIds?.length) cleanedValues.opportunityIds = values.opportunityIds

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
        if (response.status === 409) {
          throw new Error(`Email already in use (Contact ID: ${errorData.conflictingContactId})`)
        }
        throw new Error(errorData.message || errorData.error || 'Failed to update contact')
      }

      toast.success("Contact updated successfully")
      onSuccess?.()
    } catch (error) {
      console.error('Error updating contact:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update contact')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Basic Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John" />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    2-50 characters, letters only (including Greek)
                  </p>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Doe" />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    2-50 characters, letters only (including Greek)
                  </p>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                    <Input {...field} type="email" placeholder="john.doe@example.com" />
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-sm text-muted-foreground">
                  Must be a valid email address, maximum 100 characters
                </p>
              </FormItem>
            )}
          />
        </div>

        {/* Phone Numbers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Phone Numbers</h2>
            </div>
            {form.watch('phones').length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const phones = form.getValues('phones')
                  form.setValue('phones', [
                    ...phones,
                    { type: 'mobile', number: '', primary: false }
                  ])
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Phone
              </Button>
            )}
          </div>

          {form.watch('phones').map((phone, index) => (
            <div key={index} className="grid gap-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  Phone {index + 1}
                  {phone.primary && " (Primary)"}
                </h3>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const phones = form.getValues('phones').filter((_, i) => i !== index)
                      form.setValue('phones', phones)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`phones.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
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
                      <FormLabel>Number</FormLabel>
                      <FormControl>
                        <PhoneInput
                          defaultCountry="GR"
                          value={field.value}
                          onChange={(value) => field.onChange(formatToE164(value))}
                          className="flex-1"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">
                        E.164 format (e.g. +306973359331)
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              {!phone.primary && (
                <FormField
                  control={form.control}
                  name={`phones.${index}.primary`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            // Update all phones to not primary
                            const phones = form.getValues('phones').map((p, i) => ({
                              ...p,
                              primary: i === index ? Boolean(checked) : false
                            }))
                            form.setValue('phones', phones)
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Set as primary phone number
                      </FormLabel>
                    </FormItem>
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Address */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Address</h2>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Main Street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.streetNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123" />
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
                      <Input {...field} placeholder="Athens" />
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
                      <Input {...field} placeholder="Attica" />
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
                        defaultValue={field.value}
                        onChange={(country) => {
                          // Initialize address object if it doesn't exist
                          if (!form.getValues('address')) {
                            form.setValue('address', {});
                          }
                          field.onChange(country.name);
                          form.setValue('address.countryCode', country.alpha2);
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
                      <Input {...field} placeholder="12345" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Company Information</h2>
          </div>

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="company.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Company Name" />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    2-100 characters if provided
                  </p>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company.title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Software Engineer" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      2-50 characters if provided
                    </p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Type</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Technology" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      2-50 characters if provided
                    </p>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 