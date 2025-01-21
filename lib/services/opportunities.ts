import { getAccessToken } from './auth'

const OPPORTUNITY_API_URL = process.env.NEXT_PUBLIC_OPPORTUNITY_SERVICE_URL || 'https://opportunity-production.up.railway.app'

export async function claimOpportunity(opportunityId: string): Promise<void> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('No access token available')
  }

  const response = await fetch(`/api/opportunities/${opportunityId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to claim opportunity')
  }
} 