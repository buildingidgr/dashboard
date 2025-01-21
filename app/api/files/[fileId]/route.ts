import { NextResponse } from 'next/server'

const API_URL = 'https://documents-production.up.railway.app'

export async function GET(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new NextResponse('No authorization header', { status: 401 })
    }

    const { fileId } = params
    console.log('Getting file:', fileId);

    const response = await fetch(`${API_URL}/api/files/${fileId}`, {
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
    console.error('Failed to get file:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new NextResponse('No authorization header', { status: 401 })
    }

    const { fileId } = params
    console.log('Deleting file:', fileId);

    // Forward delete request to backend service
    const response = await fetch(`${API_URL}/api/files/${fileId}`, {
      method: 'DELETE',
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

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete file:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new NextResponse('No authorization header', { status: 401 })
    }

    const { fileId } = params
    console.log('Completing file upload:', fileId);

    // Forward completion request to backend service
    const response = await fetch(`${API_URL}/api/files/${fileId}/complete`, {
      method: 'POST',
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
    console.error('Failed to complete file upload:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    )
  }
} 