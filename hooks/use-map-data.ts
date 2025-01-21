import { useState, useEffect } from "react"
import { useSession, useUser } from "@clerk/nextjs"
import { exchangeClerkToken, getAccessToken } from "@/lib/services/auth"
import { toast } from "sonner"
import type { MapPoint, MapData, OpportunityDetails } from "@/types/map"

interface UseMapDataReturn {
  mapPoints: MapPoint[]
  selectedPoint: MapPoint | null
  opportunityDetails: OpportunityDetails | null
  isLoadingDetails: boolean
  isDrawerOpen: boolean
  error: Error | null
  handleMarkerClick: (point: MapPoint) => void
  setIsDrawerOpen: (open: boolean) => void
}

export function useMapData(): UseMapDataReturn {
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null)
  const [opportunityDetails, setOpportunityDetails] = useState<OpportunityDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { session } = useSession()
  const { user } = useUser()

  useEffect(() => {
    const fetchMapData = async () => {
      if (!session?.id || !user?.id) return

      try {
        let token = getAccessToken()
        if (!token) {
          const tokens = await exchangeClerkToken(session.id, user.id)
          token = tokens.access_token
        }

        const response = await fetch('/api/opportunities/map', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch map data')
        }

        const data: MapData = await response.json()
        setMapPoints(data.points || [])
        setError(null)
      } catch (error) {
        console.error('Error fetching map data:', error)
        setError(error as Error)
        toast.error('Failed to load map data')
      }
    }

    fetchMapData()
  }, [session?.id, user?.id])

  const fetchOpportunityDetails = async (pointId: string) => {
    if (!session?.id || !user?.id) return

    setIsLoadingDetails(true)
    setIsDrawerOpen(true)

    try {
      let token = getAccessToken()
      if (!token) {
        const tokens = await exchangeClerkToken(session.id, user.id)
        token = tokens.access_token
      }

      const response = await fetch(`/api/opportunities/${pointId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch opportunity details')
      }

      const data = await response.json()
      setOpportunityDetails(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching opportunity details:', error)
      setError(error as Error)
      toast.error('Failed to load opportunity details')
      setIsDrawerOpen(false)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleMarkerClick = (point: MapPoint) => {
    setSelectedPoint(point)
    fetchOpportunityDetails(point.id)
  }

  return {
    mapPoints,
    selectedPoint,
    opportunityDetails,
    isLoadingDetails,
    isDrawerOpen,
    error,
    handleMarkerClick,
    setIsDrawerOpen
  }
} 