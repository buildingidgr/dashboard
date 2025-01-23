import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const PROFILE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://profile-service-production.up.railway.app'

export async function GET(request: Request) {
  try {
    const headersList = headers()
    const token = headersList.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 })
    }

    const response = await fetch(`${PROFILE_API_URL}/api/profiles/me/professional`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return NextResponse.json(
        { error: errorData?.message || 'Failed to fetch professional information' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching professional info:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const headersList = headers()
    const token = headersList.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 })
    }

    const body = await request.json()
    const response = await fetch(`${PROFILE_API_URL}/api/profiles/me/professional`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return NextResponse.json(
        { error: errorData?.message || 'Failed to update professional information' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating professional info:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 