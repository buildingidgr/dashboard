import { NextRequest } from "next/server"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "15"
    const baseUrl = process.env.NEXT_PUBLIC_OPPORTUNITY_API_URL
    const headersList = await headers()
    const token = headersList.get("authorization")

    if (!baseUrl) {
      console.error("NEXT_PUBLIC_OPPORTUNITY_API_URL is not configured")
      return new Response("Opportunity API URL not configured", { status: 500 })
    }

    if (!token) {
      console.error("No authorization token provided in headers")
      return new Response("Authorization token is required", { status: 401 })
    }

    const url = `${baseUrl}/opportunities?page=${page}&limit=${limit}`
    console.log('\n🌐 EXTERNAL API REQUEST 🌐')
    console.log('URL:', url)
    console.log('Method: GET')
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Authorization': token.substring(0, 20) + '...'
    })
    console.log('----------------------------------------\n')

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      cache: 'no-store'
    })

    const responseText = await response.text()
    console.log('\n🌐 EXTERNAL API RESPONSE 🌐')
    console.log('Status:', response.status, response.statusText)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    console.log('Body:', responseText)
    console.log('----------------------------------------\n')

    if (!response.ok) {
      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseText,
        url,
      })
      return new Response(responseText, { status: response.status })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error('Failed to parse response as JSON:', responseText)
      return new Response("Invalid JSON response from server", { status: 500 })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Error in opportunities route:", error)
    return new Response("Internal server error", { status: 500 })
  }
} 