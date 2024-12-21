'use client'

import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import TimezoneSelect from "@/components/ui/timezone"
import CountrySelect from "@/components/ui/country-select"
import ThemeSwitcher from "@/components/ui/theme"
import { useEffect, useState } from "react"
import { getPreferences, updatePreferences } from "@/src/services/profile"
import { toast } from "sonner"

export function Preferences() {
  const { control, handleSubmit, reset, watch } = useFormContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const notificationSettings = watch('notifications.email');

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsFetching(true);
        const preferences = await getPreferences();
        reset({
          location: {
            timezone: preferences.dashboard.timezone,
            language: preferences.dashboard.language,
          },
          notifications: {
            email: preferences.notifications.email,
          },
          appearance: {
            theme: preferences.display.theme,
          },
        });
      } catch (err) {
        console.error('Error fetching preferences:', err);
        toast.error('Failed to load preferences', {
          description: 'Please check your internet connection and try again.'
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchPreferences();
  }, [reset]);

  async function onSubmit(data: any) {
    if (isLoading) return;
    
    console.log('Raw form data:', data);
    
    const transformedData = {
        dashboard: {
            timezone: data.location.timezone?.value || data.location.timezone,
            language: data.location.language?.value || data.location.language
        },
        notifications: {
            email: data.notifications.email
        },
        display: {
            theme: data.appearance.theme?.value || data.appearance.theme
        }
    };
    
    console.log('Transformed data for API:', JSON.stringify(transformedData, null, 2));
    
    try {
        setIsLoading(true);
        const response = await updatePreferences(transformedData);
        console.log('API response:', JSON.stringify(response, null, 2));
        
        toast.success('Preferences updated successfully', {
            description: 'Your preferences have been saved.'
        });
    } catch (err) {
        console.error('Failed to update preferences:', err);
        toast.error('Failed to update preferences', {
            description: 'Please check your internet connection and try again.'
        });
    } finally {
        setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <Card className="border-none">
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p>Loading preferences...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="px-4 border-none">
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Set up your account preferences. Disable/enable notifications you want to receive.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <h3 className="font-inter text-lg font-semibold mb-2">Location</h3>
            <div className="space-y-4">
              <FormField
                control={control}
                name="location.timezone"
                render={({ field }) => (
                  <FormItem>
                    <TimezoneSelect 
                      onChange={field.onChange} 
                      value={field.value} 
                      placeholder="Select a timezone" 
                      autoComplete="off"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="location.language"
                render={({ field }) => (
                  <FormItem>
                    
                    <CountrySelect 
                      onChange={field.onChange} 
                      value={field.value} 
                      placeholder="Select a country" 
                      autoComplete="off"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div>
            <h3 className="font-inter text-lg font-semibold mb-2">Notifications</h3>
            <div className="space-y-2">
              {notificationSettings ? (
                Object.entries(notificationSettings)
                  .filter(([key]) => key !== 'team_mentions')
                  .map(([key]) => (
                    <FormField
                      key={key}
                      control={control}
                      name={`notifications.email.${key}`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="font-inter text-base capitalize">{key.replace('_', ' ')}</FormLabel>
                            <FormDescription>
                              Receive {key.replace('_', ' ')} notifications
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))
              ) : (
                <p>No notification preferences available.</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-inter text-lg font-semibold mb-2">Appearance</h3>
            <FormField
              control={control}
              name="appearance.theme"
              render={({ field }) => (
                <FormItem>
                  <ThemeSwitcher />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

