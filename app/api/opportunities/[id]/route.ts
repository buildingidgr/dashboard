import { NextResponse } from 'next/server'

const OPPORTUNITY_API_URL = process.env.NEXT_PUBLIC_OPPORTUNITY_SERVICE_URL || 'https://opportunity-production.up.railway.app'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    console.log('Fetching opportunity from external API:', params.id)
    const response = await fetch(`${OPPORTUNITY_API_URL}/opportunities/${params.id}`, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error from external API:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch opportunity details' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Successfully fetched opportunity:', {
      id: data._id,
      status: data.status
    })
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying request to opportunities service:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opportunity details' },
      { status: 500 }
    )
  }
} 