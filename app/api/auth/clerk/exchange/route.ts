import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { nanoid } from 'nanoid'

// Use the same secret configuration as middleware
const JWT_SECRET = process.env.JWT_SECRET || process.env.CLERK_SECRET_KEY

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or CLERK_SECRET_KEY environment variable is not set')
}

export async function POST(request: NextRequest) {
  try {
    console.log('Token exchange request received')
    
    // Validate request body
    const body = await request.json()
    const { sessionId, userId } = body
    console.log('Request body:', { sessionId, userId })

    if (!sessionId || !userId) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: "Session ID and User ID are required" },
        { status: 400 }
      )
    }

    // Verify the session belongs to the user
    const { userId: clerkUserId, sessionId: clerkSessionId } = getAuth(request)
    console.log('Clerk auth:', { 
      clerkUserId, 
      clerkSessionId,
      matches: {
        userId: clerkUserId === userId,
        sessionId: clerkSessionId === sessionId
      }
    })
    
    if (!clerkUserId || clerkUserId !== userId || clerkSessionId !== sessionId) {
      console.log('Session verification failed')
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      )
    }

    console.log('Using secret:', JWT_SECRET.substring(0, 10) + '...')

    // Create access token
    const accessToken = await new SignJWT({
      sub: userId,
      jti: nanoid(),
      type: 'access',
      sessionId
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(JWT_SECRET))

    // Create refresh token
    const refreshToken = await new SignJWT({
      sub: userId,
      jti: nanoid(),
      type: 'refresh',
      sessionId
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET))

    console.log('Tokens generated successfully')

    const response = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: 3600
    }

    console.log('Token exchange successful')
    return NextResponse.json(response)
  } catch (error) {
    console.error('Token exchange error:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 