import { NextRequest } from 'next/server'
import { getAccessToken } from '@/lib/services/auth'

export async function GET(request: NextRequest) {
  try {
    // Get token from request headers first
    const authorization = request.headers.get('authorization')
    let token: string | undefined = authorization ? authorization.split(' ')[1] : undefined

    // If no token in headers, try to get from auth service
    if (!token) {
      const authToken = await getAccessToken()
      token = authToken || undefined
    }
    
    if (!token) {
      return new Response('Unauthorized', { status: 401 })
    }

    const opportunityApiUrl = process.env.NEXT_PUBLIC_OPPORTUNITY_API_URL
    if (!opportunityApiUrl) {
      throw new Error('NEXT_PUBLIC_OPPORTUNITY_API_URL is not defined')
    }

    console.log('Proxying request to:', `${opportunityApiUrl}/opportunities/my-changes`)
    
    const response = await fetch(`${opportunityApiUrl}/opportunities/my-changes`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Opportunity API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      
      // If unauthorized, try to refresh token and retry once
      if (response.status === 401) {
        // Get a fresh token
        const refreshedToken = await getAccessToken()
        if (refreshedToken) {
          const retryResponse = await fetch(`${opportunityApiUrl}/opportunities/my-changes`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${refreshedToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (retryResponse.ok) {
            const data = await retryResponse.json()
            const opportunities = Array.isArray(data) ? data : data.opportunities || []
            return Response.json(opportunities)
          }
        }
      }
      
      throw new Error(`Failed to fetch opportunities: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Ensure we return an array
    const opportunities = Array.isArray(data) ? data : data.opportunities || []
    return Response.json(opportunities)

  } catch (error) {
    console.error('Error in my-changes route:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch claimed opportunities' }), 
      { status: 500 }
    )
  }
} 