import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { nanoid } from 'nanoid'

// This would typically come from your environment variables
const JWT_SECRET = process.env.CLERK_SECRET_KEY || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId, sessionId } = getAuth(request)
    
    if (!userId || !sessionId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create a JWT token
    const accessToken = await new SignJWT({
      sub: userId,
      jti: nanoid(),
      type: 'access_token'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(JWT_SECRET))

    const refreshToken = await new SignJWT({
      sub: userId,
      jti: nanoid(),
      type: 'refresh_token'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET))

    return NextResponse.json({
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1 hour
    })
  } catch (error) {
    console.error('Token exchange error:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }

    return NextResponse.json(
      { message: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 