"use client"

import { useState } from 'react'
import { useProfessionalInfo } from '@/hooks/use-professional-info'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import AreaSelector from '@/components/ui/area-selector'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function ProfessionalPage() {
  const { professionalInfo, isLoading, updateInfo } = useProfessionalInfo()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    profession: {
      current: '',
      allowedValues: [] as string[]
    },
    amtee: '',
    areaOfOperation: {
      primary: '',
      address: '',
      coordinates: { latitude: 0, longitude: 0 },
      radius: 50
    }
  })

  // Initialize form data when professional info is loaded
  const handleEdit = () => {
    setFormData({
      profession: {
        current: professionalInfo?.profession.current || '',
        allowedValues: professionalInfo?.profession.allowedValues || []
      },
      amtee: professionalInfo?.amtee || '',
      areaOfOperation: {
        primary: professionalInfo?.areaOfOperation.primary || '',
        address: professionalInfo?.areaOfOperation.address || '',
        coordinates: {
          latitude: professionalInfo?.areaOfOperation.coordinates.latitude || 0,
          longitude: professionalInfo?.areaOfOperation.coordinates.longitude || 0
        },
        radius: professionalInfo?.areaOfOperation.radius || 50
      }
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const updateData = {
      profession: { 
        current: formData.profession.current,
        allowedValues: professionalInfo?.profession.allowedValues || []
      },
      amtee: formData.amtee,
      areaOfOperation: formData.areaOfOperation
    }
    await updateInfo(updateData)
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Information</CardTitle>
        <CardDescription>Manage your professional details and define your operational area</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="profession">Professional Title</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="size-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select your professional title as registered with TEE</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isEditing ? (
              <Select
                value={formData.profession.current}
                onValueChange={(value) => setFormData({
                  ...formData,
                  profession: { 
                    ...formData.profession, 
                    current: value
                  }
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your profession" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Civil Engineer",
                    "Architectural Engineer",
                    "Mechanical Engineer",
                    "Chemical Engineer",
                    "Electrical Engineer",
                    "Surveying and Rural Engineer",
                    "Naval Architect and Marine Engineer",
                    "Electronics Engineer",
                    "Mining and Metallurgical Engineer",
                    "Urban, Regional and Development Planning Engineer",
                    "Automation Engineer",
                    "Environmental Engineer",
                    "Production and Management Engineer",
                    "Acoustical Engineer",
                    "Materials Engineer",
                    "Product and Systems Design Engineer"
                  ].map((profession) => (
                    <SelectItem key={profession} value={profession}>
                      {profession}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="rounded-md w-full p-2 bg-muted">
                {professionalInfo?.profession.current || 'Not set'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="amtee">TEE Registration Number</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="size-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your unique registration number with the Technical Chamber of Greece (TEE)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isEditing ? (
              <Input
                id="amtee"
                value={formData.amtee}
                onChange={(e) => setFormData({ ...formData, amtee: e.target.value })}
                placeholder="Enter your AMTEE number"
              />
            ) : (
              <div className="rounded-md w-full p-2 bg-muted">
                {professionalInfo?.amtee || 'Not set'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Operational Area</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="size-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>Define the area where you operate. This will affect which opportunities you see in the marketplace.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-sm text-muted-foreground">
              Set your base location and coverage radius. This will be used to show you relevant opportunities within your operational area.
            </div>
            {isEditing ? (
              <AreaSelector
                value={{
                  address: formData.areaOfOperation.address,
                  coordinates: {
                    lat: formData.areaOfOperation.coordinates.latitude,
                    lng: formData.areaOfOperation.coordinates.longitude
                  },
                  radius: formData.areaOfOperation.radius
                }}
                onChange={(location) => setFormData({
                  ...formData,
                  areaOfOperation: {
                    primary: location.address,
                    address: location.address,
                    coordinates: {
                      latitude: location.coordinates.lat,
                      longitude: location.coordinates.lng
                    },
                    radius: location.radius
                  }
                })}
                disabled={!isEditing}
                maxRadius={100}
              />
            ) : (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Base Location</Label>
                  <div className="rounded-md w-full p-2 bg-muted">
                    {professionalInfo?.areaOfOperation.coordinates ? 
                      `Coordinates: ${professionalInfo.areaOfOperation.coordinates.latitude.toFixed(6)}, ${professionalInfo.areaOfOperation.coordinates.longitude.toFixed(6)}` : 
                      'Not set'}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Coverage Radius</Label>
                  <div className="rounded-md w-full p-2 bg-muted">
                    {professionalInfo?.areaOfOperation.radius ? 
                      `${professionalInfo.areaOfOperation.radius} km` : 
                      'Not set'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            {isEditing ? (
              <>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </>
            ) : (
              <Button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault()
                  handleEdit()
                }}
              >
                Edit Professional Info
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 