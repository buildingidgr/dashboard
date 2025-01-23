"use client"

import { useState, useEffect } from 'react'
import { useToast } from './use-toast'
import { getMyPreferences, updatePreferences, type ProfilePreferences } from '@/lib/services/profile'
import { useSession } from '@clerk/nextjs'

export function usePreferences() {
  const [preferences, setPreferences] = useState<ProfilePreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()
  const { session, isLoaded: isSessionLoaded } = useSession()

  const fetchPreferences = async () => {
    try {
      setIsLoading(true)
      const data = await getMyPreferences()
      setPreferences(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserPreferences = async (data: Partial<ProfilePreferences>) => {
    try {
      // Optimistically update the local state
      setPreferences(prev => prev ? { ...prev, ...data } : null)

      // Make the API call
      const updatedPreferences = await updatePreferences(data)
      
      // Update with the server response
      setPreferences(updatedPreferences)
      return updatedPreferences
    } catch (err) {
      const error = err as Error
      setError(error)
      
      // Revert to the previous state on error
      const prevPreferences = await getMyPreferences()
      setPreferences(prevPreferences)
      
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive",
      })
      throw error
    }
  }

  useEffect(() => {
    if (isSessionLoaded && session?.id) {
      fetchPreferences()
    }
  }, [isSessionLoaded, session?.id])

  return {
    preferences,
    isLoading,
    error,
    fetchPreferences,
    updatePreferences: updateUserPreferences
  }
} 