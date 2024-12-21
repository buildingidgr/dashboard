import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const OPPORTUNITY_API_URL = process.env.NEXT_PUBLIC_OPPORTUNITY_API_URL

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const headersList = await headers()
    const token = headersList.get('authorization')

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const url = `${OPPORTUNITY_API_URL}/opportunities?${searchParams.toString()}`
    console.log('Proxying request to:', url)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': token
      }
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: error || response.statusText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in opportunities API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 