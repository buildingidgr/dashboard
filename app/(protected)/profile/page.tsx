"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
import { HelpCircle, ChevronDown, ChevronRight, Image as ImageIcon, Edit2, Save, Loader2Icon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils'
import { useUploadFile } from '@/lib/hooks/use-upload-file'
import { toast } from 'sonner'
import debounce from 'lodash/debounce'
import { useSession } from '@clerk/nextjs'

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

// Create a stable debounced function outside the component
const createDebouncedSave = () => {
  let typingTimer: NodeJS.Timeout | null = null

  return debounce((
    values: TempValues,
    save: (values: TempValues) => Promise<void>
  ) => {
    // Clear any existing typing timer
    if (typingTimer) {
      clearTimeout(typingTimer)
      typingTimer = null
    }

    // Add an additional delay to ensure typing is complete
    typingTimer = setTimeout(() => {
      console.log('Debounced save executing with values:', values)
      console.error('DEBOUNCED SAVE TRIGGERED')
      void save(values).catch(error => {
        console.error('Debounced save failed:', error)
      })
    }, 3000) // Increased to 3 seconds
  }, 5000) // Increased outer debounce to 5 seconds
}

export default function ProfilePage() {
  const router = useRouter()
  const { profile, isLoading: isProfileLoading, updateProfile } = useProfile()
  const { preferences, isLoading: isPreferencesLoading, updatePreferences } = usePreferences()
  const { professionalInfo, isLoading: isProfessionalLoading, updateInfo: updateProfessionalInfo } = useProfessionalInfo()
  const { uploadFile, isUploading } = useUploadFile()
  const { session, isLoaded: isSessionLoaded } = useSession()
  
  const [isSaving, setIsSaving] = useState(false)
  const [values, setValues] = useState<TempValues>({
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

  // Refs to store latest values and functions
  const saveRef = useRef<(values: TempValues) => Promise<void>>()
  const debouncedSaveRef = useRef(createDebouncedSave())

  // Log session and loading states
  useEffect(() => {
    console.log('Session Loading State:', {
      isSessionLoaded,
      sessionId: session?.id,
      profileLoading: isProfileLoading,
      preferencesLoading: isPreferencesLoading,
      professionalInfoLoading: isProfessionalLoading
    })
  }, [isSessionLoaded, session, isProfileLoading, isPreferencesLoading, isProfessionalLoading])

  // Initialize values when data is loaded
  useEffect(() => {
    console.log('Data loading effect triggered')
    console.log('Profile:', profile)
    console.log('Preferences:', preferences)
    console.log('Professional Info:', professionalInfo)

    // Check if at least some data is available
    if (profile || preferences || professionalInfo) {
      console.log('Setting values from partially loaded data')
      setValues(prev => ({
        firstName: profile?.firstName || prev.firstName || '',
        lastName: profile?.lastName || prev.lastName || '',
        profession: professionalInfo?.profession?.current || prev.profession || '',
        amtee: professionalInfo?.amtee || prev.amtee || '',
        area: {
          address: professionalInfo?.areaOfOperation?.address || prev.area.address || '',
          coordinates: {
            lat: professionalInfo?.areaOfOperation?.coordinates.latitude || prev.area.coordinates.lat || 0,
            lng: professionalInfo?.areaOfOperation?.coordinates.longitude || prev.area.coordinates.lng || 0
          },
          radius: professionalInfo?.areaOfOperation?.radius || prev.area.radius || 50
        },
        preferences: {
          dashboard: {
            language: preferences?.dashboard?.language || prev.preferences.dashboard.language || 'en-US',
            timezone: preferences?.dashboard?.timezone || prev.preferences.dashboard.timezone || 'UTC'
          },
          notifications: {
            email: {
              marketing: preferences?.notifications?.email?.marketing ?? prev.preferences.notifications.email.marketing ?? false,
              updates: preferences?.notifications?.email?.updates ?? prev.preferences.notifications.email.updates ?? false,
              security: preferences?.notifications?.email?.security ?? prev.preferences.notifications.email.security ?? false,
              newsletters: preferences?.notifications?.email?.newsletters ?? prev.preferences.notifications.email.newsletters ?? false,
              productAnnouncements: preferences?.notifications?.email?.productAnnouncements ?? prev.preferences.notifications.email.productAnnouncements ?? false
            }
          },
          display: {
            theme: preferences?.display?.theme || prev.preferences.display.theme || 'light'
          }
        }
      }))
    } else {
      console.warn('No data is loaded', {
        profileLoaded: !!profile,
        preferencesLoaded: !!preferences,
        professionalInfoLoaded: !!professionalInfo
      })
    }
  }, [profile, preferences, professionalInfo])

  // Update save function ref when dependencies change
  useEffect(() => {
    console.log('Save function useEffect triggered')
    console.log('Dependencies:', {
      profile: !!profile,
      preferences: !!preferences,
      professionalInfo: !!professionalInfo,
      isSaving
    })

    saveRef.current = async (valuesToSave: TempValues) => {
      console.log('saveChanges executing with:', valuesToSave)
      console.log('Current state:', {
        profile: profile ? { ...profile } : null,
        preferences: preferences ? { ...preferences } : null,
        professionalInfo: professionalInfo ? { ...professionalInfo } : null
      })
      
      if (isSaving) {
        console.log('Already saving, skipping...')
        return
      }

      try {
        setIsSaving(true)

        // Update profile
        const profileChanged = valuesToSave.firstName !== profile?.firstName || valuesToSave.lastName !== profile?.lastName
        if (profileChanged) {
          console.log('Updating profile with:', {
            firstName: valuesToSave.firstName,
            lastName: valuesToSave.lastName
          })
          await updateProfile({
            firstName: valuesToSave.firstName,
            lastName: valuesToSave.lastName
          })
        }

        // Update professional info
        const professionalChanges: ProfessionalChanges = {}
        console.log('Professional Info Update Check:', {
          professionalInfoExists: !!professionalInfo,
          professionalInfoProfession: professionalInfo?.profession,
          currentProfession: valuesToSave.profession,
          storedProfession: professionalInfo?.profession?.current
        })

        // Force update if profession is different or not set
        if (
          valuesToSave.profession && 
          (!professionalInfo?.profession || 
           valuesToSave.profession !== professionalInfo.profession.current)
        ) {
          professionalChanges.profession = {
            current: valuesToSave.profession,
            allowedValues: professionalInfo?.profession?.allowedValues || [
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
            ]
          }
          console.log('Professional Info Profession Update Payload:', {
            profession: {
              current: valuesToSave.profession,
              allowedValues: professionalChanges.profession.allowedValues
            }
          })
        } else {
          console.warn('Professional info update condition not met', {
            profession: valuesToSave.profession,
            currentProfession: professionalInfo?.profession?.current
          })
        }
        if (valuesToSave.amtee !== professionalInfo?.amtee) {
          professionalChanges.amtee = valuesToSave.amtee
          console.log('Professional Info AMTEE Update Payload:', {
            amtee: valuesToSave.amtee
          })
        }
        // Force update of area of operation if any field is different or not set
        if (
          valuesToSave.area.address || 
          valuesToSave.area.coordinates.lat !== 0 || 
          valuesToSave.area.coordinates.lng !== 0 || 
          valuesToSave.area.radius !== 50
        ) {
          professionalChanges.areaOfOperation = {
            primary: valuesToSave.area.address,
            address: valuesToSave.area.address,
            coordinates: {
              latitude: valuesToSave.area.coordinates.lat,
              longitude: valuesToSave.area.coordinates.lng
            },
            radius: valuesToSave.area.radius
          }
          console.log('Professional Info Area Update Payload:', {
            areaOfOperation: {
              primary: valuesToSave.area.address,
              address: valuesToSave.area.address,
              coordinates: {
                latitude: valuesToSave.area.coordinates.lat,
                longitude: valuesToSave.area.coordinates.lng
              },
              radius: valuesToSave.area.radius
            }
          })
        } else {
          console.warn('Area of operation update condition not met', {
            savedAddress: valuesToSave.area.address,
            savedLat: valuesToSave.area.coordinates.lat,
            savedLng: valuesToSave.area.coordinates.lng,
            savedRadius: valuesToSave.area.radius
          })
        }

        if (Object.keys(professionalChanges).length > 0) {
          console.log('Full Professional Info Update Payload:', JSON.stringify(professionalChanges, null, 2))
          console.error('ATTEMPTING PROFESSIONAL INFO UPDATE')
          await updateProfessionalInfo(professionalChanges)
        }

        // Update preferences
        console.log('Current preferences:', preferences)
        console.log('Preferences to save:', valuesToSave.preferences)
        
        const preferencesChanged = 
          preferences?.dashboard &&
          (valuesToSave.preferences.dashboard.language !== preferences.dashboard.language ||
          valuesToSave.preferences.dashboard.timezone !== preferences.dashboard.timezone ||
          valuesToSave.preferences.display.theme !== preferences.display.theme ||
          JSON.stringify(valuesToSave.preferences.notifications.email) !== JSON.stringify(preferences.notifications.email))

        console.log('Preferences changed:', preferencesChanged)

        if (preferencesChanged) {
          console.log('Updating preferences with:', valuesToSave.preferences)
          console.error('ATTEMPTING PREFERENCES UPDATE')
          await updatePreferences(valuesToSave.preferences)
        }

        if (profileChanged || Object.keys(professionalChanges).length > 0 || preferencesChanged) {
          toast.success('Changes saved')
        }
      } catch (error) {
        console.error('Failed to save changes:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to save changes')
      } finally {
        setIsSaving(false)
      }
    }

    console.log('saveRef.current has been set')
  }, [profile, preferences, professionalInfo, updateProfile, updatePreferences, updateProfessionalInfo, isSaving])

  // Cleanup on unmount
  useEffect(() => {
    const currentDebouncedSave = debouncedSaveRef.current
    return () => {
      currentDebouncedSave.cancel()
    }
  }, [])

  // Handle field changes with auto-save
  const handleFieldChange = useCallback((field: string, value: FieldValue | string | boolean) => {
    console.log('Field changed:', field, 'Value:', value)
    
    setValues(prev => {
      let updatedValues: TempValues
      if (field.includes('.')) {
        const [section, subfield, subsubfield] = field.split('.')
        if (subsubfield) {
          if (section === 'preferences' && subfield === 'notifications' && subsubfield === 'email' && typeof value === 'object' && 'key' in value && 'checked' in value) {
            updatedValues = {
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
          } else {
            return prev // Invalid nested field
          }
        } else {
          const sectionKey = section as keyof TempValues
          updatedValues = {
            ...prev,
            [sectionKey]: {
              ...(prev[sectionKey] as Record<string, unknown>),
              [subfield]: value
            }
          }
        }
      } else {
        updatedValues = {
          ...prev,
          [field]: value
        }
      }

      // More controlled save mechanism
      if (saveRef.current) {
        // Log the field being changed
        console.log(`Field ${field} changed. Preparing to save...`)
        
        // Use different save strategies based on the field
        if (['firstName', 'lastName'].includes(field)) {
          // Slightly delayed save for name changes
          debouncedSaveRef.current(updatedValues, saveRef.current)
        } else if (['profession', 'amtee'].includes(field)) {
          // Very relaxed save for professional info
          debouncedSaveRef.current(updatedValues, saveRef.current)
        } else if (field.startsWith('preferences')) {
          // Most relaxed save for preferences
          debouncedSaveRef.current(updatedValues, saveRef.current)
        } else if (field === 'area') {
          // Delayed save for area to allow for precise selection
          debouncedSaveRef.current(updatedValues, saveRef.current)
        } else {
          // Fallback to standard debounced save
          debouncedSaveRef.current(updatedValues, saveRef.current)
        }
      } else {
        console.error('saveRef.current is undefined')
      }
      
      return updatedValues
    })
  }, [])

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
          <Skeleton className="size-32 rounded-full" />
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
      <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-8">
        {/* Profile Header */}
        <div className="flex items-end justify-between mb-16">
          <div className="flex items-end">
            <div className="relative group">
              <Avatar className={cn(
                "size-40 border-4 border-background shadow-lg",
                isUploading && "opacity-70"
              )}>
                <AvatarImage src={profile?.avatarUrl} alt={`${values.firstName} ${values.lastName}`} />
                <AvatarFallback className="text-3xl">
                  {values.firstName?.[0]}{values.lastName?.[0]}
                </AvatarFallback>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                    <Loader2Icon className="size-8 text-white animate-spin" />
                  </div>
                )}
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className={cn(
                  "absolute bottom-0 right-0 bg-background hover:bg-muted transition rounded-full p-2 cursor-pointer shadow-sm",
                  isUploading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isUploading ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <Edit2 className="size-4" />
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </label>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-muted-foreground">
                PNG format, max 2MB
              </div>
            </div>
            <div className="ml-8 mb-6">
              <h1 className="text-4xl font-bold bg-background px-4 py-2 rounded-lg shadow-sm">
                <span>{values.firstName} {values.lastName}</span>
              </h1>
              <div className="mt-2 px-4 space-y-1">
                <p className="text-muted-foreground">{profile?.email}</p>
                {values.profession && (
                  <p className="text-muted-foreground">{values.profession}</p>
                )}
                {values.amtee && (
                  <p className="text-muted-foreground">AMTEE: {values.amtee}</p>
                )}
              </div>
            </div>
          </div>
          {isSaving && (
            <div className="mb-6 text-sm text-muted-foreground animate-pulse">
              Saving changes...
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-8 mt-16">
          {/* Personal Information */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <button
              className="w-full px-8 py-6 flex items-center justify-between hover:bg-accent/50 text-left"
            >
              <div>
                <h2 className="text-xl font-semibold">Personal Information</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your basic profile information and contact details</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </button>
            <div className="px-8 py-6 border-t space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>First Name</Label>
                  <div className="mt-1">
                    <Input
                      value={values.firstName}
                      onChange={(e) => {
                        const newValue = e.target.value
                        console.log('First Name Input Change:', {
                          currentValue: newValue,
                          previousValue: values.firstName
                        })
                        handleFieldChange('firstName', newValue)
                      }}
                      placeholder="Enter your first name"
                      className="tracking-wider"
                    />
                  </div>
                </div>
                <div>
                  <Label>Last Name</Label>
                  <div className="mt-1">
                    <Input
                      value={values.lastName}
                      onChange={(e) => {
                        const newValue = e.target.value
                        console.log('Last Name Input Change:', {
                          currentValue: newValue,
                          previousValue: values.lastName
                        })
                        handleFieldChange('lastName', newValue)
                      }}
                      placeholder="Enter your last name"
                      className="tracking-wider"
                    />
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
          </div>

          {/* Professional Information */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <button
              className="w-full px-8 py-6 flex items-center justify-between hover:bg-accent/50 text-left"
            >
              <div>
                <h2 className="text-xl font-semibold">Professional Information</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure your professional credentials, TEE registration, and area of operation</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </button>
            <div className="px-8 py-6 border-t space-y-8">
              <div>
                <div className="flex items-center gap-2">
                  <Label>Professional Title</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="size-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Your official professional title as registered with the Technical Chamber of Greece (TEE). This will be displayed on your profile and documents.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground mt-1 mb-2">Select your engineering specialty to ensure compliance with TEE regulations and access to relevant features.</p>
                <div className="mt-1">
                  <Select
                    value={values.profession}
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
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Label>AMTEE Number</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="size-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Your unique Technical Chamber of Greece (TEE) registration number. This number verifies your professional status and is required for official documents.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground mt-1 mb-2">Enter your TEE registration number to validate your professional credentials and enable document signing.</p>
                <div className="mt-1">
                  <Input
                    value={values.amtee}
                    onChange={(e) => {
                      const newValue = e.target.value
                      console.log('AMTEE Input Change:', {
                        currentValue: newValue,
                        previousValue: values.amtee
                      })
                      handleFieldChange('amtee', newValue)
                    }}
                    placeholder="e.g., 123456"
                    className="tracking-wider"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Label>Area of Operation</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="size-4 text-muted-foreground" />
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
                    <div>
                      <AreaSelector
                        value={values.area}
                        onChange={(value) => {
                          handleFieldChange('area', value)
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <button
              className="w-full px-8 py-6 flex items-center justify-between hover:bg-accent/50 text-left"
            >
              <div>
                <h2 className="text-xl font-semibold">Preferences</h2>
                <p className="text-sm text-muted-foreground mt-1">Customize your dashboard settings, notifications, and display preferences</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </button>
            <div className="px-8 py-6 border-t space-y-8">
              <div className="space-y-6">
                <h3 className="font-medium text-lg">Dashboard Settings</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Language</Label>
                    <Select
                      value={values.preferences.dashboard.language}
                      onValueChange={(value) => {
                        handleFieldChange('preferences.dashboard.language', value)
                      }}
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
                      value={values.preferences.dashboard.timezone}
                      onChange={(value) => {
                        handleFieldChange('preferences.dashboard', {
                          ...values.preferences.dashboard,
                          timezone: value
                        })
                      }}
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
                        checked={values.preferences.notifications.email[key as EmailNotificationKey]}
                        onCheckedChange={(checked) => {
                          handleFieldChange('preferences.notifications.email', { key, checked })
                        }}
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
                    checked={values.preferences.display.theme === 'dark'}
                    onCheckedChange={(checked) => {
                      handleFieldChange('preferences.display.theme', checked ? 'dark' : 'light')
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



