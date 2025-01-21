"use client"

import { useState } from 'react'
import Image from 'next/image'
import { useProfile } from '@/hooks/use-profile'
import { usePreferences } from '@/hooks/use-preferences'
import { useProfessionalInfo } from '@/hooks/use-professional-info'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import AreaSelector from '@/components/ui/area-selector'
import TimezoneSelect from '@/components/ui/timezone'
import { HelpCircle, ChevronDown, ChevronRight, Image as ImageIcon, Edit2, Check } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils'
import { useUploadFile } from '@/lib/hooks/use-upload-file'
import { toast } from 'sonner'

const LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'el-GR', label: 'Greek' },
]

interface TempValues {
  firstName: string
  lastName: string
  profession: string
  amtee: string
  area: {
    address: string
    coordinates: { lat: number; lng: number }
    radius: number
  }
  preferences: {
    dashboard: {
      language: string
      timezone: string
    }
    notifications: {
      email: {
        marketing: boolean
        updates: boolean
        security: boolean
        newsletters: boolean
        productAnnouncements: boolean
      }
    }
    display: {
      theme: 'light' | 'dark'
    }
  }
}

type EmailNotificationKey = keyof TempValues['preferences']['notifications']['email']

interface ProfessionalChanges {
  profession?: {
    current: string;
    allowedValues: string[];
  };
  amtee?: string;
  areaOfOperation?: {
    primary: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    radius: number;
  };
}

interface FieldValue {
  key?: string;
  checked?: boolean;
  [key: string]: unknown;
}

export default function ProfilePage() {
  const { profile, isLoading: isProfileLoading, updateProfile } = useProfile()
  const { preferences, isLoading: isPreferencesLoading, updatePreferences } = usePreferences()
  const { professionalInfo, isLoading: isProfessionalLoading, updateInfo: updateProfessionalInfo } = useProfessionalInfo()
  const { uploadFile, isUploading } = useUploadFile()
  
  const [isEditing, setIsEditing] = useState(false)
  const [tempValues, setTempValues] = useState<TempValues>({
    firstName: '',
    lastName: '',
    profession: '',
    amtee: '',
    area: {
      address: '',
      coordinates: { lat: 0, lng: 0 },
      radius: 50
    },
    preferences: {
      dashboard: {
        language: '',
        timezone: ''
      },
      notifications: {
        email: {
          marketing: false,
          updates: false,
          security: false,
          newsletters: false,
          productAnnouncements: false
        }
      },
      display: {
        theme: 'light'
      }
    }
  })

  // Initialize temp values when entering edit mode
  const initializeTempValues = () => {
    setTempValues({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      profession: professionalInfo?.profession.current || '',
      amtee: professionalInfo?.amtee || '',
      area: {
        address: professionalInfo?.areaOfOperation?.address || '',
        coordinates: {
          lat: professionalInfo?.areaOfOperation?.coordinates.latitude || 0,
          lng: professionalInfo?.areaOfOperation?.coordinates.longitude || 0
        },
        radius: professionalInfo?.areaOfOperation?.radius || 50
      },
      preferences: {
        dashboard: {
          language: preferences?.dashboard.language || 'en-US',
          timezone: preferences?.dashboard.timezone || 'UTC'
        },
        notifications: {
          email: {
            marketing: preferences?.notifications.email.marketing || false,
            updates: preferences?.notifications.email.updates || false,
            security: preferences?.notifications.email.security || false,
            newsletters: preferences?.notifications.email.newsletters || false,
            productAnnouncements: preferences?.notifications.email.productAnnouncements || false
          }
        },
        display: {
          theme: preferences?.display.theme || 'light'
        }
      }
    })
  }

  // Save all changes
  const saveChanges = async () => {
    try {
      // Update profile
      if (tempValues.firstName !== profile?.firstName || tempValues.lastName !== profile?.lastName) {
        await updateProfile({
          firstName: tempValues.firstName,
          lastName: tempValues.lastName
        })
      }

      // Update professional info
      const professionalChanges: ProfessionalChanges = {}
      if (tempValues.profession !== professionalInfo?.profession.current) {
        professionalChanges.profession = {
          current: tempValues.profession,
          allowedValues: professionalInfo?.profession.allowedValues || []
        }
      }
      if (tempValues.amtee !== professionalInfo?.amtee) {
        professionalChanges.amtee = tempValues.amtee
      }
      if (
        tempValues.area.address !== professionalInfo?.areaOfOperation?.address ||
        tempValues.area.coordinates.lat !== professionalInfo?.areaOfOperation?.coordinates.latitude ||
        tempValues.area.coordinates.lng !== professionalInfo?.areaOfOperation?.coordinates.longitude ||
        tempValues.area.radius !== professionalInfo?.areaOfOperation?.radius
      ) {
        professionalChanges.areaOfOperation = {
          primary: tempValues.area.address,
          address: tempValues.area.address,
          coordinates: {
            latitude: tempValues.area.coordinates.lat,
            longitude: tempValues.area.coordinates.lng
          },
          radius: tempValues.area.radius
        }
      }
      if (Object.keys(professionalChanges).length > 0) {
        await updateProfessionalInfo(professionalChanges)
      }

      // Update preferences
      const preferencesChanged = 
        tempValues.preferences.dashboard.language !== preferences?.dashboard.language ||
        tempValues.preferences.dashboard.timezone !== preferences?.dashboard.timezone ||
        tempValues.preferences.display.theme !== preferences?.display.theme ||
        JSON.stringify(tempValues.preferences.notifications.email) !== JSON.stringify(preferences?.notifications.email)

      if (preferencesChanged) {
        await updatePreferences(tempValues.preferences)
      }

      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Failed to save changes:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save changes')
    }
  }

  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    professional: true,
    preferences: true
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleFieldChange = (field: string, value: FieldValue | string | boolean) => {
    setTempValues(prev => {
      if (field.includes('.')) {
        const [section, subfield, subsubfield] = field.split('.')
        if (subsubfield) {
          if (section === 'preferences' && subfield === 'notifications' && subsubfield === 'email' && typeof value === 'object' && 'key' in value && 'checked' in value) {
            return {
              ...prev,
              preferences: {
                ...prev.preferences,
                notifications: {
                  ...prev.preferences.notifications,
                  email: {
                    ...prev.preferences.notifications.email,
                    [value.key as EmailNotificationKey]: value.checked
                  }
                }
              }
            }
          }
        }
        const sectionKey = section as keyof TempValues
        return {
          ...prev,
          [sectionKey]: {
            ...(prev[sectionKey] as Record<string, unknown>),
            [subfield]: value
          }
        }
      }
      return {
        ...prev,
        [field]: value
      }
    })
  }

  const handleCoverPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadFile(file)
      await updateProfile({ coverPhoto: result.url })
      toast.success('Cover photo updated successfully')
    } catch {
      toast.error('Failed to update cover photo')
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'image/png') {
      toast.error('Please upload a PNG image')
      return
    }

    // Validate file size (2MB limit)
    const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image size should be less than 2MB')
      return
    }

    try {
      const result = await uploadFile(file)
      await updateProfile({ avatarUrl: result.url })
      toast.success('Profile picture updated successfully')
    } catch {
      toast.error('Failed to update profile picture')
    }
  }

  if (isProfileLoading || isPreferencesLoading || isProfessionalLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[200px] bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
        <div className="max-w-4xl mx-auto -mt-16 px-4">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="mt-8 space-y-8">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Photo Section */}
      <div className="relative w-full h-56 rounded-lg overflow-hidden bg-muted">
        {profile?.coverPhoto ? (
          <Image
            src={profile.coverPhoto}
            alt="Cover"
            fill
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute bottom-4 right-4">
          <label htmlFor="cover-photo-upload">
            <div className="bg-background hover:bg-muted transition rounded-full p-2 cursor-pointer">
              <Edit2 className="h-5 w-5" />
            </div>
            <input
              id="cover-photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverPhotoUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-24 relative z-10">
        {/* Profile Header */}
        <div className="-mt-20 mb-12 flex items-end">
          <div className="relative group">
            <Avatar className="h-40 w-40 border-4 border-background shadow-lg">
              <AvatarImage src={profile?.avatarUrl} alt={`${profile?.firstName} ${profile?.lastName}`} />
              <AvatarFallback className="text-3xl">
                {profile?.firstName?.[0]}{profile?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <label 
              htmlFor="avatar-upload" 
              className={cn(
                "absolute bottom-0 right-0 bg-background hover:bg-muted transition rounded-full p-2 cursor-pointer shadow-sm",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Edit2 className="h-4 w-4" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/png"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </label>
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground">
              PNG format, max 2MB
            </div>
          </div>
          <div className="ml-8 mb-6">
            <h1 className="text-4xl font-bold bg-background px-4 py-2 rounded-lg shadow-sm">
              <span>{profile?.firstName} {profile?.lastName}</span>
            </h1>
            <p className="text-muted-foreground mt-2 px-4">{profile?.email}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Personal Information */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <button
              className="w-full px-8 py-6 flex items-center justify-between hover:bg-accent/50"
              onClick={() => toggleSection('personal')}
            >
              <h2 className="text-xl font-semibold">Personal Information</h2>
              {expandedSections.personal ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
            {expandedSections.personal && (
              <div className="px-8 py-6 border-t space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>First Name</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          value={tempValues.firstName}
                          onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        />
                      ) : (
                        <div className="px-3 py-2 rounded border bg-muted/50">
                          {profile?.firstName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <div className="mt-1">
                      {isEditing ? (
                        <Input
                          value={tempValues.lastName}
                          onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        />
                      ) : (
                        <div className="px-3 py-2 rounded border bg-muted/50">
                          {profile?.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="mt-1 px-3 py-2 rounded border bg-muted/50">
                    {profile?.email}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Professional Information */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <button
              className="w-full px-8 py-6 flex items-center justify-between hover:bg-accent/50"
              onClick={() => toggleSection('professional')}
            >
              <h2 className="text-xl font-semibold">Professional Information</h2>
              {expandedSections.professional ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
            {expandedSections.professional && (
              <div className="px-8 py-6 border-t space-y-8">
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Professional Title</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>Your official professional title as registered with the Technical Chamber of Greece (TEE). This will be displayed on your profile and documents.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 mb-2">Select your engineering specialty to ensure compliance with TEE regulations and access to relevant features.</p>
                  <div className="mt-1">
                    {isEditing ? (
                      <Select
                        value={tempValues.profession}
                        onValueChange={(value) => handleFieldChange('profession', value)}
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
                      <div className="px-3 py-2 rounded border bg-muted/50">
                        {professionalInfo?.profession.current || 'Not set'}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label>AMTEE Number</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>Your unique Technical Chamber of Greece (TEE) registration number. This number verifies your professional status and is required for official documents.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 mb-2">Enter your TEE registration number to validate your professional credentials and enable document signing.</p>
                  <div className="mt-1">
                    {isEditing ? (
                      <Input
                        value={tempValues.amtee}
                        onChange={(e) => handleFieldChange('amtee', e.target.value)}
                        placeholder="e.g., 123456"
                      />
                    ) : (
                      <div className="px-3 py-2 rounded border bg-muted/50">
                        {professionalInfo?.amtee || 'Not set'}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label>Area of Operation</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>Define your primary work location and operational radius. This helps clients find you and determines which regional projects you can participate in.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-2 mt-1 mb-3">
                    <p className="text-sm text-muted-foreground">Set your primary work location and coverage area to:</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      <li>Be discoverable by nearby clients</li>
                      <li>Receive relevant project notifications</li>
                      <li>Comply with regional licensing requirements</li>
                    </ul>
                  </div>
                  <div className="mt-1">
                    {isProfessionalLoading ? (
                      <div className="h-[400px] w-full rounded-md border bg-muted/50 animate-pulse" />
                    ) : professionalInfo ? (
                      <AreaSelector
                        value={isEditing ? tempValues.area : {
                          address: professionalInfo.areaOfOperation?.address || '',
                          coordinates: {
                            lat: professionalInfo.areaOfOperation?.coordinates.latitude || 0,
                            lng: professionalInfo.areaOfOperation?.coordinates.longitude || 0
                          },
                          radius: professionalInfo.areaOfOperation?.radius || 50
                        }}
                        onChange={(value) => {
                          if (isEditing) {
                            handleFieldChange('area', value)
                          }
                        }}
                        disabled={!isEditing}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <button
              className="w-full px-8 py-6 flex items-center justify-between hover:bg-accent/50"
              onClick={() => toggleSection('preferences')}
            >
              <h2 className="text-xl font-semibold">Preferences</h2>
              {expandedSections.preferences ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
            {expandedSections.preferences && (
              <div className="px-8 py-6 border-t space-y-8">
                <div className="space-y-6">
                  <h3 className="font-medium text-lg">Dashboard Settings</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Language</Label>
                      <Select
                        value={isEditing ? tempValues.preferences.dashboard.language : preferences?.dashboard.language || 'en-US'}
                        onValueChange={(value) => {
                          if (isEditing) {
                            handleFieldChange('preferences.dashboard.language', value)
                          } else {
                            updatePreferences({
                              dashboard: {
                                timezone: preferences?.dashboard.timezone || 'UTC',
                                language: value
                              }
                            })
                          }
                        }}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Timezone</Label>
                      <TimezoneSelect
                        value={isEditing ? tempValues.preferences.dashboard.timezone : preferences?.dashboard.timezone || 'UTC'}
                        onChange={(value) => {
                          if (isEditing) {
                            handleFieldChange('preferences.dashboard', {
                              ...tempValues.preferences.dashboard,
                              timezone: value
                            })
                          } else {
                            updatePreferences({
                              ...preferences,
                              dashboard: {
                                language: preferences?.dashboard.language || 'en-US',
                                timezone: value
                              }
                            })
                          }
                        }}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-medium text-lg">Email Notifications</h3>
                  <div className="space-y-8">
                    {[
                      {
                        key: 'marketing',
                        title: 'Marketing',
                        description: 'Receive emails about new features, promotions, and special offers'
                      },
                      {
                        key: 'updates',
                        title: 'Platform Updates',
                        description: 'Get notified about platform updates, maintenance, and new features'
                      },
                      {
                        key: 'security',
                        title: 'Security Alerts',
                        description: 'Important security notifications and account activity alerts'
                      },
                      {
                        key: 'newsletters',
                        title: 'Newsletters',
                        description: 'Regular newsletters with industry insights and best practices'
                      },
                      {
                        key: 'productAnnouncements',
                        title: 'Product Announcements',
                        description: 'Stay informed about new products, services, and major changes'
                      }
                    ].map(({ key, title, description }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>{title}</Label>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                        <Switch
                          checked={isEditing ? tempValues.preferences.notifications.email[key as EmailNotificationKey] : preferences?.notifications.email[key as EmailNotificationKey]}
                          onCheckedChange={(checked) => {
                            if (isEditing) {
                              handleFieldChange('preferences.notifications.email', { key, checked })
                            } else {
                              updatePreferences({
                                notifications: {
                                  email: {
                                    marketing: preferences?.notifications.email.marketing || false,
                                    updates: preferences?.notifications.email.updates || false,
                                    security: preferences?.notifications.email.security || false,
                                    newsletters: preferences?.notifications.email.newsletters || false,
                                    productAnnouncements: preferences?.notifications.email.productAnnouncements || false,
                                    [key]: checked
                                  }
                                }
                              })
                            }
                          }}
                          disabled={!isEditing}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-medium text-lg">Display</h3>
                  <div className="flex items-center justify-between">
                    <Label>Dark Mode</Label>
                    <Switch
                      checked={isEditing 
                        ? tempValues.preferences.display.theme === 'dark'
                        : preferences?.display.theme === 'dark'
                      }
                      onCheckedChange={(checked) => {
                        if (isEditing) {
                          handleFieldChange('preferences.display.theme', checked ? 'dark' : 'light')
                        } else {
                          updatePreferences({
                            display: {
                              theme: checked ? 'dark' : 'light'
                            }
                          })
                        }
                      }}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Edit Controls */}
        <div className="flex justify-end mt-12 pt-8 border-t">
          {!isEditing ? (
            <Button 
              onClick={() => {
                setIsEditing(true)
                initializeTempValues()
              }}
              size="lg"
              className="px-6"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                size="lg"
                className="px-6"
              >
                Cancel
              </Button>
              <Button onClick={saveChanges} size="lg" className="px-6">
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



