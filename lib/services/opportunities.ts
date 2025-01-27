import { getAccessToken } from './auth'

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
    },
    body: JSON.stringify({ status: 'private' })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to claim opportunity')
  }
} 