import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')
    const authHeader = request.headers.get('authorization')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 })
    }

    const response = await fetch(
      `https://contacts-production-ca50.up.railway.app/api/contacts/find-by-email?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to check contact')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error checking contact:', error)
    return NextResponse.json(
      { error: 'Failed to check contact' },
      { status: 500 }
    )
  }
} 