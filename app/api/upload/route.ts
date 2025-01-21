import { NextResponse } from 'next/server'

const API_URL = 'https://documents-production.up.railway.app'

export async function POST(req: Request) {
  try {
    console.log('Received upload request')

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.log('No authorization header found')
      return new NextResponse('No authorization header', { status: 401 })
    }

    // Get the form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new NextResponse('No file provided', { status: 400 })
    }

    // Create the request body in the format expected by the backend
    const body = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    }

    console.log('Sending request to backend:', body)

    // First get the pre-signed URL
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    console.log('Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`Backend service error: ${response.statusText}`)
    }

    const { fileId, uploadUrl, fields } = await response.json()
    console.log('Got pre-signed URL:', { fileId, uploadUrl })

    // Create form data for S3 upload
    const s3FormData = new FormData()
    Object.entries(fields).forEach(([key, value]) => {
      s3FormData.append(key, value as string)
    })
    s3FormData.append('file', file)

    // Upload to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: s3FormData
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to S3')
    }

    return NextResponse.json({ fileId })
  } catch (error) {
    console.error('Failed to upload file:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    )
  }
} 