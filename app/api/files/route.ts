import { NextResponse } from 'next/server'

const API_URL = 'https://documents-production.up.railway.app'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new NextResponse('No authorization header', { status: 401 })
    }

    // Forward request to backend service with the same token
    const response = await fetch(`${API_URL}/api/files`, {
      headers: {
        'Authorization': authHeader,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, response.statusText)
      console.error('Error details:', errorText)
      throw new Error(`Backend service error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch files:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    )
  }
} 