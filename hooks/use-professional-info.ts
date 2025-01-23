"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { ProfessionalInformation, getMyProfessionalInfo, updateProfessionalInfo } from '@/lib/services/profile'
import { debounce } from 'lodash'

export function useProfessionalInfo() {
  const [professionalInfo, setProfessionalInfo] = useState<ProfessionalInformation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const fetchingRef = useRef(false)
  const mountedRef = useRef(false)
  const lastUpdateRef = useRef<string>('')

  const fetchProfessionalInfo = async () => {
    // Prevent duplicate requests
    if (fetchingRef.current) return;
    
    try {
      fetchingRef.current = true;
      console.log('Fetching professional info...')
      setIsLoading(true)
      const data = await getMyProfessionalInfo()
      console.log('Professional Info Received:', data)
      if (!data) {
        throw new Error('No data received from API')
      }
      if (mountedRef.current) {
        setProfessionalInfo(data)
      }
    } catch (error) {
      console.error('Error details:', error)
      if (mountedRef.current) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load professional information",
          variant: "destructive"
        })
      }
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const updateInfo = useCallback(async (data: Partial<ProfessionalInformation>) => {
    const updateKey = JSON.stringify(data)
    if (updateKey === lastUpdateRef.current) {
      return;
    }

    try {
      // Optimistically update the local state
      setProfessionalInfo(prev => prev ? { ...prev, ...data } : null)

      // Make the API call
      const updated = await updateProfessionalInfo(data)
      
      // Update with the server response
      if (mountedRef.current) {
        setProfessionalInfo(updated)
        lastUpdateRef.current = updateKey
      }
    } catch (error) {
      console.error('Update error:', error)
      
      // Revert to the previous state on error
      if (mountedRef.current) {
        const prevInfo = await getMyProfessionalInfo()
        setProfessionalInfo(prevInfo)
        
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update professional information",
          variant: "destructive"
        })
      }
    }
  }, [toast])

  useEffect(() => {
    mountedRef.current = true;
    console.log('Professional info hook mounted')
    fetchProfessionalInfo()
    return () => {
      mountedRef.current = false;
    }
  }, [])

  return {
    professionalInfo,
    isLoading,
    updateInfo,
    refetch: fetchProfessionalInfo
  }
} 