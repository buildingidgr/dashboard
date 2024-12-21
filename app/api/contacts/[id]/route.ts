import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

const CONTACTS_API_URL = process.env.CONTACTS_API_URL || 'https://contacts-production-ca50.up.railway.app'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching contact details for ID:', params.id)
    
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const url = `${CONTACTS_API_URL}/api/contacts/${params.id}`
    console.log('Making request to:', url)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': authorization
      }
    })

    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error response:', error)
      return NextResponse.json(error, { status: response.status })
    }

    const contact = await response.json()
    console.log('Successfully fetched contact')
    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')

    if (!authorization) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const url = `${CONTACTS_API_URL}/api/contacts/${params.id}`
    
    console.log('Updating contact:', {
      url,
      body
    })
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authorization
      },
      body: JSON.stringify(body)
    })

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
        console.error('Parsed error response:', errorData)
      } catch {
        console.error('Raw error response:', errorText)
        errorData = { message: errorText }
      }
      
      return NextResponse.json(
        { error: errorData.message || errorData.error || 'Failed to update contact' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')

    if (!authorization) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const url = `${CONTACTS_API_URL}/api/contacts/${params.id}`
    
    console.log('Deleting contact:', { url })
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': authorization
      }
    })

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
        console.error('Parsed error response:', errorData)
      } catch {
        console.error('Raw error response:', errorText)
        errorData = { message: errorText }
      }

      // Handle specific error cases
      switch (response.status) {
        case 404:
          return NextResponse.json(
            { error: 'Contact not found' },
            { status: 404 }
          )
        case 403:
          return NextResponse.json(
            { error: 'Forbidden', details: 'You do not have permission to delete this contact' },
            { status: 403 }
          )
        default:
          return NextResponse.json(
            { error: errorData.message || errorData.error || 'Failed to delete contact' },
            { status: response.status }
          )
      }
    }

    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('API Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 