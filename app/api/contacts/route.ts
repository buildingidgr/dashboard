import { NextResponse } from 'next/server'
import { headers, cookies } from 'next/headers'
import { refreshToken } from '@/lib/services/auth'

const CONTACTS_API_URL = process.env.CONTACTS_API_URL || 'https://contacts-production-ca50.up.railway.app'

async function getRefreshTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('refreshToken')?.value || null
}

async function handleTokenRefresh() {
  const refreshTokenValue = await getRefreshTokenFromCookies()
  if (!refreshTokenValue) {
    throw new Error('No refresh token available')
  }

  try {
    const tokens = await refreshToken(refreshTokenValue)
    const newAccessToken = tokens.access_token;
    return newAccessToken;
  } catch (error) {
    console.error('Token refresh failed:', error)
    throw new Error('Failed to refresh token')
  }
}

export async function GET(request: Request) {
  try {
    const headersList = await headers()
    const authorization = headersList.get('authorization')

    console.log('Authorization header present:', !!authorization)
    if (authorization) {
      console.log('Token format check:', {
        startsWithBearer: authorization.startsWith('Bearer '),
        tokenLength: authorization.length,
        firstChars: authorization.substring(0, 30) + '...'
      })
    }

    if (!authorization) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    let token = authorization.replace('Bearer ', '')

    const { searchParams } = new URL(request.url)
    const queryString = new URLSearchParams()

    // Forward pagination parameters
    if (searchParams.has('page')) {
      queryString.append('page', searchParams.get('page')!)
    }
    if (searchParams.has('limit')) {
      queryString.append('limit', searchParams.get('limit')!)
    }

    // Forward search parameter
    if (searchParams.has('search')) {
      queryString.append('search', searchParams.get('search')!)
    }

    const url = `${CONTACTS_API_URL}/api/contacts?${queryString}`
    
    console.log('Making request to:', url)
    
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    // If token is expired, try to refresh it
    if (response.status === 401) {
      console.log('Token expired, attempting refresh...')
      try {
        token = await handleTokenRefresh()
        console.log('Token refreshed successfully')
        
        // Retry the request with the new token
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (error) {
        console.error('Token refresh failed:', error)
        return NextResponse.json(
          { error: 'Session expired. Please log in again.' },
          { status: 401 }
        )
      }
    }

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
        console.error('Parsed error response:', errorData)
      } catch {
        console.error('Raw error response:', errorText)
        errorData = { message: errorText }
      }
      
      return NextResponse.json(
        { error: errorData.message || errorData.error || 'API request failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Detailed API Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: CONTACTS_API_URL
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const authHeader = headersList.get('authorization')?.toString()

    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    // Extract the token without the 'Bearer ' prefix if it exists
    const token = authHeader.replace('Bearer ', '')

    const body = await request.json()
    const url = `${CONTACTS_API_URL}/api/contacts`
    
    // Pass through the request body without transformation
    const contactData = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phones: body.phones || [],
      address: body.address,
      opportunityIds: body.opportunityIds || []
    }

    // Log the actual request to the Public Contacts API
    console.log('\n🌐 PUBLIC CONTACTS API REQUEST 🌐')
    console.log('URL:', url)
    console.log('Method: POST')
    console.log('Headers:', {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token.substring(0, 10) + '...'
    })
    console.log('Body:', JSON.stringify(contactData, null, 2))
    console.log('----------------------------------------\n')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(contactData)
    })

    const responseText = await response.text()
    
    // Log the response from the Public Contacts API
    console.log('\n🌐 PUBLIC CONTACTS API RESPONSE 🌐')
    console.log('Status:', response.status, response.statusText)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    console.log('Body:', responseText)
    console.log('----------------------------------------\n')

    if (!response.ok) {
      console.error('API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      })

      let errorMessage = 'Failed to create contact'
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch (e) {
        console.error('Failed to parse error response:', e)
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse success response:', e)
      return NextResponse.json(
        { error: 'Invalid response from server' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Detailed error in contacts API route:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 