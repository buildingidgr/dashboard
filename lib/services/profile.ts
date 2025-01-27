import { getAccessToken } from './auth'

export interface Profile {
  _id: string
  clerkId: string
  email: string
  emailVerified: boolean
  phoneNumber: string | null
  phoneVerified: boolean
  username: string | null
  firstName: string
  lastName: string
  avatarUrl: string
  coverPhoto?: string
  apiKey: string
  createdAt: string
  updatedAt: string
}

export interface ProfilePreferences {
  dashboard: {
    timezone: string
    language: string
  }
  notifications: {
    email: {
      marketing: boolean
      updates: boolean
      security: boolean
      newsletters: boolean
      productAnnouncements: boolean
    }
  }
  display: {
    theme: 'light' | 'dark'
  }
}

export interface ProfessionalInformation {
  profession: {
    current: string
    allowedValues: string[]
  }
  amtee: string
  areaOfOperation: {
    primary: string
    address: string
    coordinates: {
      latitude: number
      longitude: number
    }
    radius?: number
  }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 5): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        // Calculate exponential backoff time: 2^attempt * 2000ms (2s, 4s, 8s, 16s, 32s)
        const backoffTime = Math.min(Math.pow(2, attempt) * 2000, 32000);
        console.log(`Rate limited. Retrying in ${backoffTime}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await wait(backoffTime);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      if (attempt < maxRetries - 1) {
        const backoffTime = Math.min(Math.pow(2, attempt) * 2000, 32000);
        console.log(`Request failed. Retrying in ${backoffTime}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await wait(backoffTime);
      }
    }
  }
  throw lastError || new Error('Max retries reached');
}

export async function getMyProfile(): Promise<Profile> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('No access token available')
  }

  const response = await fetchWithRetry('/api/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'Failed to fetch profile')
  }

  return response.json()
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  username?: string | null;
  avatarUrl?: string;
  coverPhoto?: string;
}

export async function updateProfile(data: UpdateProfileData): Promise<Profile> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('No access token available')
  }

  const response = await fetchWithRetry('/api/profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'Failed to update profile')
  }

  return response.json()
}

export async function getMyPreferences(): Promise<ProfilePreferences> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('No access token available')
  }

  const response = await fetchWithRetry('/api/profile/preferences', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'Failed to fetch preferences')
  }

  const data = await response.json()
  console.log('Preferences response:', data)
  return data.preferences  // Extract preferences from the response
}

export async function updatePreferences(data: Partial<ProfilePreferences>): Promise<ProfilePreferences> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('No access token available')
  }

  console.log('Updating preferences with data:', data)

  const response = await fetchWithRetry('/api/profile/preferences', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    console.error('Preferences update error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    })
    throw new Error(errorData?.message || 'Failed to update preferences')
  }

  const responseData = await response.json()
  console.log('Preferences update response:', responseData)
  return responseData.preferences  // Extract preferences from the response
}

export async function getMyProfessionalInfo(): Promise<ProfessionalInformation> {
  const token = getAccessToken()
  console.log('Token available:', !!token)
  if (!token) {
    throw new Error('No access token available')
  }

  const response = await fetchWithRetry('/api/profile/professional', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    console.error('Professional info response:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    })
    throw new Error(errorData?.message || 'Failed to fetch professional information')
  }

  const data = await response.json()
  console.log('Professional info data:', data)
  return data.professionalInfo  // Extract professionalInfo from the response
}

export async function updateProfessionalInfo(data: Partial<ProfessionalInformation>): Promise<ProfessionalInformation> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('No access token available')
  }

  console.log('Updating professional info with data:', data)
  console.log('Request Payload:', JSON.stringify({
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: data
  }, null, 2))

  try {
    const response = await fetchWithRetry('/api/profile/professional', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Professional info update error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(errorData?.message || 'Failed to update professional information')
    }

    const responseData = await response.json()
    console.log('Professional info update response:', responseData)
    return responseData.professionalInfo  // Extract professionalInfo from the response
  } catch (error) {
    console.error('Unexpected error in updateProfessionalInfo:', error)
    throw error
  }
} 