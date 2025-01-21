import { NextResponse } from 'next/server'

async function validateToken(token: string): Promise<boolean> {
  try {
    const cleanToken = token.replace('Bearer ', '')
    console.log('Validating token...')
    
    const response = await fetch('https://auth-service-production-16ee.up.railway.app/v1/token/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: cleanToken
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Token validation failed:', {
        status: response.status,
        error: errorData
      })
      return false
    }

    const data = await response.json()
    console.log('Token validation response:', data)
    return data.isValid === true
  } catch (error) {
    console.error('Error validating token:', error)
    return false
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    console.log('Received auth header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'none')

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // Validate token first
    const isValid = await validateToken(authHeader)
    if (!isValid) {
      return NextResponse.json({ 
        error: 'Invalid or expired token',
        details: 'Please obtain a new token'
      }, { status: 401 })
    }

    // Ensure token is in Bearer format
    const token = authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`
    
    const url = 'https://opportunity-production.up.railway.app/opportunities/map-coordinates'
    console.log('Making request to:', url)
    console.log('With token format:', token.substring(0, 20) + '...')

    const response = await fetch(url, {
      headers: {
        'Authorization': token,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Opportunity service error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        headers: Object.fromEntries(response.headers.entries())
      })
      return NextResponse.json(
        { error: errorText || 'Failed to fetch opportunities data' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Successfully fetched map data')
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying request to opportunities service:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opportunities data' },
      { status: 500 }
    )
  }
} 