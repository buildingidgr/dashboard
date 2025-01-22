import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const AUTH_API_URL = process.env.AUTH_API_URL

if (!AUTH_API_URL) {
  throw new Error('AUTH_API_URL environment variable is not set')
}

export async function POST(request: Request) {
  try {
    const { sessionId, userId } = await request.json()
    const headersList = headers()
    const origin = headersList.get('origin')

    // Set CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { 
          status: 400,
          headers: corsHeaders
        }
      )
    }

    console.log('Exchanging token for:', { sessionId, userId })
    const response = await fetch(`${AUTH_API_URL}/v1/token/clerk/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        userId,
      }),
    })

    const responseText = await response.text()
    console.log('Auth service response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Token exchange failed: ${responseText}` },
        { 
          status: response.status,
          headers: corsHeaders
        }
      )
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse auth service response:', e)
      return NextResponse.json(
        { error: 'Invalid response from auth service' },
        { 
          status: 500,
          headers: corsHeaders
        }
      )
    }

    return NextResponse.json(data, {
      headers: corsHeaders
    })
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true'
        }
      }
    )
  }
}

export async function OPTIONS(request: Request) {
  const headersList = headers()
  const origin = headersList.get('origin')

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    },
  })
} 