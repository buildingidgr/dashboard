import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const OPPORTUNITY_API_URL = process.env.NEXT_PUBLIC_OPPORTUNITY_API_URL

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers()
    const token = headersList.get('authorization')

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const opportunityId = params.id
    const url = `${OPPORTUNITY_API_URL}/opportunities/${opportunityId}/status`
    console.log('Proxying request to:', url)

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(body)
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
    console.error('Error in opportunity status update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 