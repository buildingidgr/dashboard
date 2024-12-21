'use client'

import { useState, useEffect } from 'react'
import { useSession, useUser } from "@clerk/nextjs"
import { getAccessToken, setAccessToken } from "@/src/utils/tokenManager"
import { exchangeClerkToken } from "@/src/services/auth"
import { getProfile, updateProfile } from '@/src/services/profile'
import { useFormContext } from "react-hook-form"
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'

export function PersonalInfo() {
  const { isLoaded, isSignedIn } = useAuth();
  const { session } = useSession();
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset } = useFormContext();

  useEffect(() => {
    if (!isLoaded || !session) return;

    if (!isSignedIn) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        let accessToken = getAccessToken();
        
        if (!accessToken) {
          const tokens = await exchangeClerkToken(session.id, user?.id as string);
          setAccessToken(tokens.accessToken, tokens.expiresIn);
          accessToken = tokens.accessToken;
        }

        const profile = await getProfile();
        reset({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          mobilePhone: profile.phoneNumber,
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isLoaded, isSignedIn, session, user, reset, router]);

  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
      });
      toast.success('Personal information updated successfully', {
        description: 'Your profile changes have been saved.'
      });
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error('Failed to update profile', {
        description: 'There was a problem saving your changes. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Card className="border-none shadow-none">
        <CardContent>
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="px-4 border-none shadow-none">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Set up your personal information. Mobile number can not be changed at the moment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} autoComplete="given-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isLoading} autoComplete="family-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input {...field} disabled={true} autoComplete="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="mobilePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={true}
                    defaultCountry="GR"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

