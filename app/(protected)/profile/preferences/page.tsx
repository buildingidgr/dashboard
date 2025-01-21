"use client"

import { usePreferences } from '@/hooks/use-preferences'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect, useCallback } from 'react'
import { type ProfilePreferences } from '@/lib/services/profile'
import TimezoneSelect from '@/components/ui/timezone'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from '@/hooks/use-toast'

const LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'el-GR', label: 'Greek' },
]

export default function PreferencesPage() {
  const { preferences, isLoading, updatePreferences } = usePreferences()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfilePreferences | null>(null)
  const { toast } = useToast()

  const resetFormData = useCallback(() => {
    setFormData(preferences)
  }, [preferences])

  useEffect(() => {
    resetFormData()
  }, [resetFormData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    try {
      await updatePreferences(formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update preferences:', error)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsEditing(false)
    resetFormData()
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsEditing(true)
  }

  if (isLoading || !formData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Preferences</CardTitle>
          <CardDescription>Customize your account settings and dashboard experience to match your workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Language Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="language">Language</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Choose your preferred language for the dashboard interface</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                disabled={!isEditing}
                value={formData.dashboard.language}
                onValueChange={(value) => setFormData({
                  ...formData,
                  dashboard: { ...formData.dashboard, language: value }
                })}
              >
                <SelectTrigger className="w-full">
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

            {/* Timezone Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Set your local timezone for accurate scheduling and notifications</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <TimezoneSelect
                value={formData.dashboard.timezone}
                onChange={(timezone) => setFormData({
                  ...formData,
                  dashboard: { ...formData.dashboard, timezone }
                })}
                disabled={!isEditing}
              />
            </div>

            {/* Notifications Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label>Email Notifications</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Manage your email notification preferences</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketing" className="text-sm text-muted-foreground">Marketing emails</Label>
                  <Switch
                    id="marketing"
                    checked={formData.notifications.email.marketing}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notifications: {
                        ...formData.notifications,
                        email: { ...formData.notifications.email, marketing: checked }
                      }
                    })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="updates" className="text-sm text-muted-foreground">Product updates</Label>
                  <Switch
                    id="updates"
                    checked={formData.notifications.email.updates}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notifications: {
                        ...formData.notifications,
                        email: { ...formData.notifications.email, updates: checked }
                      }
                    })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="security" className="text-sm text-muted-foreground">Security alerts</Label>
                  <Switch
                    id="security"
                    checked={formData.notifications.email.security}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notifications: {
                        ...formData.notifications,
                        email: { ...formData.notifications.email, security: checked }
                      }
                    })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="newsletters" className="text-sm text-muted-foreground">Newsletters</Label>
                  <Switch
                    id="newsletters"
                    checked={formData.notifications.email.newsletters}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notifications: {
                        ...formData.notifications,
                        email: { ...formData.notifications.email, newsletters: checked }
                      }
                    })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="announcements" className="text-sm text-muted-foreground">Product announcements</Label>
                  <Switch
                    id="announcements"
                    checked={formData.notifications.email.productAnnouncements}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      notifications: {
                        ...formData.notifications,
                        email: { ...formData.notifications.email, productAnnouncements: checked }
                      }
                    })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        {isEditing ? (
          <>
            <Button type="button" variant="outline" onClick={handleCancel} className="mr-2">Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </>
        ) : (
          <Button type="button" onClick={handleEdit}>Edit Preferences</Button>
        )}
      </div>
    </form>
  )
} 