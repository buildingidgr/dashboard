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
import { getAccessToken } from '@/src/utils/tokenManager'
import { PhoneInput } from "@/components/ui/phone-input"
import { CountryDropdown, Country } from "@/components/ui/country-dropdown"

// Validation schema based on API documentation
const phoneSchema = z.object({
  type: z.enum(["work", "mobile", "home"]),
  number: z.string()
    .regex(/^\+[1-9]\d{7,19}$/, {
      message: "Please select a country code and enter a valid phone number"
    }),
  primary: z.boolean()
})

const addressSchema = z.object({
  street: z.string().min(5).max(100),
  unit: z.string().max(20).optional(),
  city: z.string().min(2).max(50).regex(/^[a-zA-Z\s]+$/),
  state: z.string().min(2).max(50),
  country: z.string().length(2),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional()
}).optional()

const companySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  title: z.string().trim().min(2).max(50).optional(),
  type: z.string().trim().min(2).max(50).optional()
}).optional().transform(data => {
  if (!data) return undefined;
  
  // Remove empty string fields
  const cleanedData = {
    name: data.name || undefined,
    title: data.title || undefined,
    type: data.type || undefined
  };
  
  // If all fields are undefined, return undefined
  if (!cleanedData.name && !cleanedData.title && !cleanedData.type) {
    return undefined;
  }
  
  return cleanedData;
});

const formSchema = z.object({
  firstName: z.string().min(2).max(50).regex(/^[a-zA-Z]+$/),
  lastName: z.string().min(2).max(50).regex(/^[a-zA-Z]+$/),
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

interface ContactCreateFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

// Helper function to format phone number to E.164
function formatToE164(phoneNumber: string | undefined): string {
  if (!phoneNumber) return ''
  // Remove all non-digit characters except the leading +
  return phoneNumber.replace(/[^\d+]/g, '')
}

export function ContactCreateForm({ onSuccess, onCancel }: ContactCreateFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phones: [{
        type: "mobile",
        number: "",
        primary: true
      }],
      address: {
        street: "",
        city: "",
        state: "",
        country: "GR",
        postalCode: ""
      },
      company: undefined,
      tags: []
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Form submission started');
    setIsLoading(true)
    try {
      const accessToken = getAccessToken()
      console.log('Token check:', {
        hasToken: !!accessToken,
        tokenPreview: accessToken ? `${accessToken.substring(0, 10)}...` : 'null'
      });

      if (!accessToken) {
        throw new Error("No access token available")
      }

      console.log('Preparing to submit form with values:', values)
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(values)
      })

      console.log('API Response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Error response:', error)
        if (response.status === 409) {
          throw new Error(`Email already in use (Contact ID: ${error.conflictingContactId})`)
        }
        throw new Error(error.message || error.error || 'Failed to create contact')
      }

      const data = await response.json()
      console.log('Contact created successfully:', data)
      toast.success("Contact created successfully")
      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create contact')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit((values) => {
          console.log('Form submit event triggered');
          console.log('Form values:', values);
          onSubmit(values);
        }, (errors) => {
          console.log('Form validation failed:', errors);
          
          // Type-safe error handling
          if (errors.firstName) {
            toast.error(`First Name: ${errors.firstName.message}`);
          }
          if (errors.lastName) {
            toast.error(`Last Name: ${errors.lastName.message}`);
          }
          if (errors.email) {
            toast.error(`Email: ${errors.email.message}`);
          }
          if (errors.phones) {
            toast.error(`Phone: ${errors.phones.message}`);
          }
          if (errors.address) {
            toast.error(`Address: ${errors.address.message}`);
          }
          if (errors.company) {
            toast.error(`Company: ${errors.company.message}`);
          }
        })} 
        className="space-y-6"
      >
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
                      onChange={(value) => {
                        console.log('Phone number changed:', value);
                        field.onChange(formatToE164(value) || '');
                      }}
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
                  <Input 
                    {...field} 
                    value={field.value || ''} 
                    onChange={(e) => field.onChange(e.target.value.trim())}
                  />
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
                  <Input 
                    {...field} 
                    value={field.value || ''} 
                    onChange={(e) => field.onChange(e.target.value.trim())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 mt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Contact"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 