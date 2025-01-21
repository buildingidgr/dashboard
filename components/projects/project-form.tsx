"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Contact } from "@/components/contacts/columns"
import { getAccessToken } from "@/lib/services/auth"
import { DocumentIcon, ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatFileSize } from "@/lib/utils/format-file-size"

const projectTypes = [
  { value: "residential", label: "Residential Building" },
  { value: "commercial", label: "Commercial Building" },
  { value: "industrial", label: "Industrial Facility" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "renovation", label: "Renovation" },
  { value: "other", label: "Other" },
] as const

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  type: z.enum(["residential", "commercial", "industrial", "infrastructure", "renovation", "other"]),
  description: z.string().min(1, "Project description is required"),
  location: z.object({
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
  }),
  details: z.object({
    totalArea: z.string().min(1, "Total area is required"),
    estimatedDuration: z.string().min(1, "Estimated duration is required"),
    budget: z.string().optional(),
    constructionType: z.string().min(1, "Construction type is required"),
  }),
  permits: z.object({
    required: z.array(z.string()).optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
  }),
  contactId: z.string().optional(),
  fileIds: z.array(z.string()).optional(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

const defaultValues: Partial<ProjectFormValues> = {
  type: "residential",
  permits: {
    required: [],
    status: "pending",
  },
}

type ProjectFormProps = {
  mode?: 'create' | 'edit'
  projectId?: string
  initialData?: ProjectFormValues
}

export function ProjectForm({ mode = 'create', projectId, initialData }: ProjectFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [files, setFiles] = useState<Array<{
    id: string
    name: string
    type: string
    status: string
  }>>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>(initialData?.fileIds || [])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files
    const query = searchQuery.toLowerCase()
    return files.filter(file => 
      file.name.toLowerCase().includes(query) || 
      file.type.toLowerCase().includes(query)
    )
  }, [files, searchQuery])

  // Fetch contacts when component mounts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const accessToken = getAccessToken()
        if (!accessToken) {
          throw new Error("No access token available")
        }

        const response = await fetch('/api/contacts', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch contacts')
        }

        const data = await response.json()
        setContacts(data.data)
      } catch (error) {
        console.error('Error fetching contacts:', error)
        toast.error('Failed to load contacts')
      }
    }

    fetchContacts()
  }, [])

  // Fetch files when component mounts
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const accessToken = getAccessToken()
        if (!accessToken) {
          throw new Error("No access token available")
        }

        const response = await fetch('/api/files', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch files')
        }

        const data = await response.json()
        setFiles(data.files)
      } catch (error) {
        console.error('Error fetching files:', error)
        toast.error('Failed to load files')
      }
    }

    fetchFiles()
  }, [])

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData || defaultValues,
  })

  async function onSubmit(data: ProjectFormValues) {
    setIsLoading(true)
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error("No access token available")
      }

      const endpoint = mode === 'edit' ? `/api/projects/${projectId}` : '/api/projects'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(mode === 'edit' ? 'Failed to update project' : 'Failed to create project')
      }

      toast.success(mode === 'edit' ? "Project updated successfully" : "Project created successfully")
      router.push(mode === 'edit' ? `/projects/${projectId}` : "/projects")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        throw new Error("No access token available")
      }

      // Validate file size (50MB)
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
      }

      // Validate file type
      const SUPPORTED_FILE_TYPES = [
        'application/pdf',
        'application/x-dwg',
        'application/x-dxf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ];

      const isImage = file.type.startsWith('image/');
      const isValidType = isImage || SUPPORTED_FILE_TYPES.includes(file.type);
      
      if (!isValidType) {
        throw new Error('Unsupported file type. Please upload a PDF, DWG, DXF, Office document, or image file.');
      }

      setUploadProgress(20) // Start progress

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      setUploadProgress(50) // File uploaded, processing

      const { fileId } = await response.json()
      
      // Call the completion endpoint
      const completeResponse = await fetch(`/api/files/${fileId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete file upload')
      }

      setUploadProgress(80) // Almost done

      // Refresh the files list
      const filesResponse = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!filesResponse.ok) {
        throw new Error('Failed to fetch updated files')
      }

      const data = await filesResponse.json()
      setFiles(data.files)
      // Automatically select the newly uploaded file
      setSelectedFiles(prev => {
        const newSelected = [...prev, fileId]
        form.setValue('fileIds', newSelected)
        return newSelected
      })
      setUploadProgress(100) // Complete
      toast.success('File uploaded successfully')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      // Reset progress after a short delay to show completion
      setTimeout(() => {
        setUploadProgress(0)
        setIsUploading(false)
      }, 500)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              {/* Basic Information */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the project..."
                          className="h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Contact Selection */}
                <FormField
                  control={form.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Contact</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a contact" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.firstName} {contact.lastName} {contact.company?.name ? `(${contact.company.name})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the client contact for this project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Location</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="location.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location.postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter postal code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Project Details */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Project Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="details.totalArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Area (m²)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter total area" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="details.estimatedDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Duration (months)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter duration" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="details.budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget (€)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter budget" {...field} />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="details.constructionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Construction Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Reinforced Concrete" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Permits & Regulations */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Permits & Regulations</h3>
                <FormField
                  control={form.control}
                  name="permits.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes on Permits and Regulations</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any notes about required permits, regulations, or compliance requirements..."
                          className="h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Optional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* File Attachments */}
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">File Attachments</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(file)
                        }
                      }}
                      accept=".pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx,image/*"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload New"}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Select Files
                          <ChevronDownIcon className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[300px]">
                        <DropdownMenuLabel className="text-sm font-medium">Available Files</DropdownMenuLabel>
                        <div className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        <DropdownMenuSeparator />
                        <div className="h-[200px] overflow-y-auto py-1">
                          {filteredFiles.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              {files.length === 0 ? "No files available" : "No matches found"}
                            </div>
                          ) : (
                            filteredFiles.map((file) => (
                              <DropdownMenuItem
                                key={file.id}
                                onSelect={(e) => {
                                  e.preventDefault()
                                  const isSelected = selectedFiles.includes(file.id)
                                  if (isSelected) {
                                    const newSelected = selectedFiles.filter(id => id !== file.id)
                                    setSelectedFiles(newSelected)
                                    form.setValue('fileIds', newSelected)
                                  } else {
                                    setSelectedFiles([...selectedFiles, file.id])
                                    form.setValue('fileIds', [...selectedFiles, file.id])
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedFiles.includes(file.id)}
                                    className="h-4 w-4 rounded border-gray-300"
                                    readOnly
                                  />
                                  <DocumentIcon className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {file.type.toUpperCase()} • {file.status}
                                    </span>
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            ))
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {uploadProgress < 50 && "Uploading file..."}
                        {uploadProgress >= 50 && uploadProgress < 80 && "Processing file..."}
                        {uploadProgress >= 80 && uploadProgress < 100 && "Finalizing..."}
                        {uploadProgress === 100 && "Upload complete!"}
                      </span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map(fileId => {
                      const file = files.find(f => f.id === fileId)
                      if (!file) return null
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm"
                        >
                          <DocumentIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{file.name}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              const newSelected = selectedFiles.filter(id => id !== file.id)
                              setSelectedFiles(newSelected)
                              form.setValue('fileIds', newSelected)
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                <FormDescription>
                  Select files to attach to this project or upload new ones. Only approved or ready files can be attached.
                </FormDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(mode === 'edit' ? `/projects/${projectId}` : "/projects")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (mode === 'edit' ? "Updating..." : "Creating...") : (mode === 'edit' ? "Update Project" : "Create Project")}
          </Button>
        </div>
      </form>
    </Form>
  )
} 