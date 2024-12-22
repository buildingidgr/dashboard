import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const OPPORTUNITY_API_URL = process.env.NEXT_PUBLIC_OPPORTUNITY_API_URL

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const headersList = await headers()
    const token = headersList.get('authorization')?.toString()

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      )
    }

    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'

    if (!OPPORTUNITY_API_URL) {
      throw new Error('NEXT_PUBLIC_OPPORTUNITY_API_URL environment variable is not defined')
    }

    const queryParams = new URLSearchParams({
      page,
      limit,
      status: 'private'
    })

    const response = await fetch(
      `${OPPORTUNITY_API_URL}/opportunities/my-changes?${queryParams}`,
      {
        headers: {
          'Authorization': token
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: errorText || response.statusText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching opportunities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    )
  }
} 