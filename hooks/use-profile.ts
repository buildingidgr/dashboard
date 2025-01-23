"use client"

import { useState, useEffect } from 'react'
import { useToast } from './use-toast'
import { getMyProfile, updateProfile, type Profile } from '@/lib/services/profile'
import { useSession } from '@clerk/nextjs'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()
  const { session, isLoaded: isSessionLoaded } = useSession()

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const data = await getMyProfile()
      setProfile(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfileData = async (data: Partial<Profile>) => {
    try {
      // Optimistically update the local state
      setProfile(prev => prev ? { ...prev, ...data } : null)

      // Make the API call
      const updatedProfile = await updateProfile(data)
      
      // Update with the server response
      setProfile(updatedProfile)
      return updatedProfile
    } catch (err) {
      const error = err as Error
      setError(error)
      
      // Revert to the previous state on error
      const prevProfile = await getMyProfile()
      setProfile(prevProfile)
      
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
      throw error
    }
  }

  useEffect(() => {
    if (isSessionLoaded && session?.id) {
      fetchProfile()
    }
  }, [isSessionLoaded, session?.id])

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile: updateProfileData
  }
} 