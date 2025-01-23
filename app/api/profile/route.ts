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

    const response = await fetch(`${PROFILE_API_URL}/api/profiles/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return NextResponse.json(
        { error: errorData?.message || 'Failed to fetch profile' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching profile:', error)
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
    const response = await fetch(`${PROFILE_API_URL}/api/profiles/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return NextResponse.json(
        { error: errorData?.message || 'Failed to update profile' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 