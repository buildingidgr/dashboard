import { NextRequest } from 'next/server'
import { getAccessToken } from '@/src/utils/tokenManager'

export async function verifyAuth(request: NextRequest) {
  const accessToken = getAccessToken()
  
  if (!accessToken) {
    throw new Error('No access token available')
  }

  return { accessToken }
} 