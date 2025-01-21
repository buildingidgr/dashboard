import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const OPPORTUNITY_API_URL = process.env.NEXT_PUBLIC_OPPORTUNITY_SERVICE_URL || 'https://opportunity-production.up.railway.app'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers()
    const authHeader = headersList.get('authorization')

    if (!authHeader) {
      return new NextResponse(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401 }
      )
    }

    const response = await fetch(
      `${OPPORTUNITY_API_URL}/opportunities/${params.id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'private'
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return new NextResponse(
        JSON.stringify({ error: error || 'Failed to update opportunity status' }),
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating opportunity status:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
} 