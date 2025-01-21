'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PlusIcon,
  DocumentIcon,
  EllipsisVerticalIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useToast } from "@/hooks/use-toast"
import { getAccessToken } from '@/lib/services/auth'
import { useRouter } from 'next/navigation'
import { DocumentsService } from '@/lib/services/documents'

interface FileData {
  id: string
  name: string
  type: string
  size: number
  url: string
  key: string
  status: 'pending' | 'processing' | 'ready' | 'failed' | 'approved'
  uploadedAt: string
  updatedAt: string
  metadata?: {
    version: number
    fileType: string
    description: string
  }
}

interface MechLabsDocument {
  id: string
  title: string
  content?: {
    type: string
    content: any[]
  }
  createdAt: string
  updatedAt: string
}

type DocumentType = 'files' | 'text'

// Add supported file types constant
const SUPPORTED_FILE_TYPES = {
  // PDF files
  'application/pdf': '.pdf',
  // AutoCAD files
  'application/x-dwg': '.dwg',
  'application/x-dxf': '.dxf',
  // Microsoft Office files
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  // Image files
  'image/png': '.png',
  'image/jpeg': '.jpg,.jpeg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
} as const;

// Create accept string for file input
const ACCEPTED_FILE_EXTENSIONS = Object.values(SUPPORTED_FILE_TYPES).join(',');

// Maximum file size (50MB in bytes)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

async function uploadFile(file: globalThis.File, token: string, onProgress?: (progress: number) => void): Promise<string> {
  try {
    console.log('Starting file upload:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
    }

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isValidType = isImage || Object.keys(SUPPORTED_FILE_TYPES).includes(file.type);
    
    if (!isValidType) {
      throw new Error('Unsupported file type. Please upload a PDF, DWG, DXF, Office document, or image file.');
    }

    // Create form data with just the file
    const formData = new FormData();
    formData.append('file', file);

    console.log('FormData created, sending request to /api/upload');

    // Upload directly to our backend
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error('Failed to upload file')
    }

    const { fileId } = await response.json();
    console.log('Upload successful, received fileId:', fileId);
    
    // Simulate upload progress while processing
    let progress = 50;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 10, 90);
      onProgress?.(progress);
    }, 500);

    // Call the completion endpoint
    console.log('Calling completion endpoint for fileId:', fileId);
    const completeResponse = await fetch(`/api/files/${fileId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    clearInterval(progressInterval);

    if (!completeResponse.ok) {
      const errorText = await completeResponse.text();
      console.error('Failed to complete upload:', {
        status: completeResponse.status,
        statusText: completeResponse.statusText,
        error: errorText
      });
      throw new Error('Failed to complete file upload')
    }

    onProgress?.(100);
    return fileId;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function DocumentsPage() {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileData[]>([])
  const [documents, setDocuments] = useState<MechLabsDocument[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [activeTab, setActiveTab] = useState<DocumentType>('files')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Fetch files and documents on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const token = getAccessToken()
        if (!token) {
          toast({
            title: "Error",
            description: "Authentication required",
            variant: "destructive"
          })
          return
        }

        // Fetch files
        const filesResponse = await fetch('/api/files', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!filesResponse.ok) {
          throw new Error('Failed to fetch files')
        }

        const filesData = await filesResponse.json()
        setFiles(filesData.files || [])

        // Fetch documents using DocumentsService
        try {
          const documentsData = await DocumentsService.getDocuments({
            orderBy: 'updatedAt',
            order: 'desc',
            limit: '50'
          })
          setDocuments(documentsData.items || [])
        } catch (docError) {
          console.error('Failed to fetch documents:', docError)
          toast({
            title: "Error",
            description: docError instanceof Error ? docError.message : "Failed to fetch documents",
            variant: "destructive"
          })
          setDocuments([])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch data",
          variant: "destructive"
        })
        // Ensure we have empty arrays if the fetch fails
        setFiles([])
        setDocuments([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement
    const file = fileInput.files?.[0]

    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      })
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      
      const token = getAccessToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive"
        })
        return
      }

      const fileId = await uploadFile(file, token, (progress) => {
        setUploadProgress(progress);
      })
      
      // Refresh file list after upload
      const response = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch updated files')
      }

      const data = await response.json()
      setFiles(data.files)
      toast({
        title: "Success",
        description: "File uploaded successfully"
      })
      
      // Close the upload dialog
      setIsUploadDialogOpen(false)
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      const token = getAccessToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      setFiles(files.filter(file => file.id !== fileId))
      toast({
        title: "Success",
        description: "File deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive"
      })
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const token = getAccessToken()
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      setDocuments(documents.filter(doc => doc.id !== documentId))
      toast({
        title: "Success",
        description: "Document deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive"
      })
    }
  }

  const handleFileClick = async (file: FileData) => {
    console.log('File clicked:', file);
    
    try {
      const token = getAccessToken();
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive"
        });
        return;
      }

      // Fetch latest file details
      const response = await fetch(`/api/files/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file details');
      }

      const data = await response.json();
      console.log('File details:', data);

      // The API returns the file object directly
      const updatedFile = data;
      
      // Update the file in the list with latest data
      setFiles(files => files.map(f => 
        f.id === file.id ? { ...f, ...updatedFile } : f
      ));

      // Open file in new tab if ready/approved
      if (updatedFile.status === 'ready' || updatedFile.status === 'approved') {
        console.log('Opening file in new tab:', updatedFile.url);
        window.open(updatedFile.url, '_blank');
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch file details",
        variant: "destructive"
      });
    }
  };

  const handleCreateDocument = async () => {
    try {
      const doc = await DocumentsService.createDocument()
      router.push(`/editor?id=${doc.id}`)
      toast({
        title: "Success",
        description: "New document created"
      })
    } catch (error) {
      console.error('Failed to create document:', error)
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          toast({
            title: "Error",
            description: "Network error: Please check your internet connection",
            variant: "destructive"
          })
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          toast({
            title: "Error",
            description: "Session expired. Please sign in again",
            variant: "destructive"
          })
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          toast({
            title: "Error",
            description: "Document limit reached. Please upgrade your plan",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Error",
            description: `Failed to create document: ${error.message}`,
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred while creating the document",
          variant: "destructive"
        })
      }
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <div className="flex items-center space-x-2">
          {activeTab === 'files' ? (
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <ArrowUpTrayIcon className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New File</DialogTitle>
                  <DialogDescription>
                    Upload a new file to your dashboard. Supported formats: PDF, DWG, DXF, Office documents (DOC, DOCX, XLS, XLSX), and images. Maximum file size: {formatFileSize(MAX_FILE_SIZE)}.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="file">File</Label>
                    <Input 
                      id="file" 
                      type="file" 
                      className="mt-1"
                      accept={ACCEPTED_FILE_EXTENSIONS}
                      disabled={isUploading}
                    />
                  </div>
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {uploadProgress < 50 && "Uploading file..."}
                          {uploadProgress >= 50 && uploadProgress < 90 && "Processing file..."}
                          {uploadProgress >= 90 && uploadProgress < 100 && "Finalizing..."}
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
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsUploadDialogOpen(false)}
                      type="button"
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={handleCreateDocument}>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Document
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Your Documents</CardTitle>
                <CardDescription>
                  Manage your files and text documents in one place.
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex rounded-md shadow-sm">
                  <Button
                    variant={activeTab === 'files' ? 'default' : 'outline'}
                    className="rounded-r-none"
                    onClick={() => setActiveTab('files')}
                  >
                    Files
                  </Button>
                  <Button
                    variant={activeTab === 'text' ? 'default' : 'outline'}
                    className="rounded-l-none"
                    onClick={() => setActiveTab('text')}
                  >
                    Text Documents
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <FunnelIcon className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuItem onClick={() => setSelectedType('all')}>
                      All
                    </DropdownMenuItem>
                    {activeTab === 'files' ? (
                      <>
                        <DropdownMenuItem onClick={() => setSelectedType('pdf')}>PDF</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedType('cad')}>CAD</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedType('office')}>Office</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedType('image')}>Images</DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => setSelectedType('recent')}>Recent</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedType('shared')}>Shared</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedType('all')
                  }}
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          <div className="flex items-center justify-center">
                            <ArrowPathIcon className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : activeTab === 'files' ? (
                      files.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No files found. Upload your first file to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        files
                          .filter((file) => {
                            if (searchQuery) {
                              return file.name.toLowerCase().includes(searchQuery.toLowerCase())
                            }
                            if (selectedType !== 'all') {
                              // Add your file type filtering logic here
                              return true
                            }
                            return true
                          })
                          .map((file) => (
                            <TableRow key={file.id}>
                              <TableCell className="font-medium">{file.name}</TableCell>
                              <TableCell>{file.status}</TableCell>
                              <TableCell>{new Date(file.updatedAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <EllipsisVerticalIcon className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                                      <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleDeleteFile(file.id)}
                                    >
                                      <TrashIcon className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                      )
                    ) : (
                      documents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No documents found. Create your first document to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        documents
                          .filter((doc) => {
                            if (searchQuery) {
                              return doc.title.toLowerCase().includes(searchQuery.toLowerCase())
                            }
                            if (selectedType !== 'all') {
                              // Add your document type filtering logic here
                              return true
                            }
                            return true
                          })
                          .map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-medium"
                                  onClick={() => router.push(`/editor?id=${doc.id}`)}
                                >
                                  {doc.title}
                                </Button>
                              </TableCell>
                              <TableCell>Ready</TableCell>
                              <TableCell>{new Date(doc.updatedAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <EllipsisVerticalIcon className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/editor?id=${doc.id}`)}>
                                      <DocumentIcon className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleDeleteDocument(doc.id)}
                                    >
                                      <TrashIcon className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 