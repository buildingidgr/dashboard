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

    let body
    try {
      const rawBody = await request.text()
      console.log('Raw request body:', rawBody)
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { status } = body
    if (!status) {
      return NextResponse.json(
        { error: 'Status field is required' },
        { status: 400 }
      )
    }

    console.log('Making request to external API:', {
      url: `${OPPORTUNITY_API_URL}/opportunities/${params.id}/status`,
      method: 'PATCH',
      body: { status }
    })

    const response = await fetch(
      `${OPPORTUNITY_API_URL}/opportunities/${params.id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('External API Error:', {
        status: response.status,
        statusText: response.statusText,
        error,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      let errorMessage = 'Failed to update opportunity status'
      try {
        // Try to parse error as JSON
        const errorData = JSON.parse(error)
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // If error is not JSON, use the raw error text if available
        errorMessage = error || errorMessage
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating opportunity status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 