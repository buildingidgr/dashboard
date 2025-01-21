import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { nanoid } from 'nanoid'

const JWT_SECRET = process.env.CLERK_SECRET_KEY || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { message: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Verify the refresh token
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      )

      if (payload.type !== 'refresh_token') {
        throw new Error('Invalid token type')
      }

      // Create new tokens
      const accessToken = await new SignJWT({
        sub: payload.sub,
        jti: nanoid(),
        type: 'access_token'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(JWT_SECRET))

      const refreshToken = await new SignJWT({
        sub: payload.sub,
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
      console.error('Token verification error:', error)
      return NextResponse.json(
        { message: 'Invalid refresh token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 