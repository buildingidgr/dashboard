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

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )
    }

    const response = await fetch(`${AUTH_API_URL}/v1/token/clerk/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUTH_SERVICE_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        userId,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: `Token exchange failed: ${error}` },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
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
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
      'Access-Control-Max-Age': '86400'
    },
  })
} 