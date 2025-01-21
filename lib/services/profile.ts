import { getAccessToken } from './auth'

const PROFILE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://profile-service-production.up.railway.app'

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
  let lastError: any;
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
      lastError = error;
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

  const response = await fetch(`${PROFILE_API_URL}/api/profiles/me`, {
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
  name?: string;
  email?: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
}

export async function updateProfile(data: UpdateProfileData): Promise<Response> {
  try {
    const response = await fetch(`${PROFILE_API_URL}/api/profiles/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error: unknown) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

export async function getMyPreferences(): Promise<ProfilePreferences> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('No access token available')
  }

  const response = await fetch(`${PROFILE_API_URL}/api/profiles/me/preferences`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'Failed to fetch preferences')
  }

  return response.json()
}

export async function updatePreferences(data: Partial<ProfilePreferences>): Promise<ProfilePreferences> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('No access token available')
  }

  const response = await fetch(`${PROFILE_API_URL}/api/profiles/me/preferences`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'Failed to update preferences')
  }

  return response.json()
}

export async function getMyProfessionalInfo(): Promise<ProfessionalInformation> {
  const token = getAccessToken()
  console.log('Token available:', !!token)
  if (!token) {
    throw new Error('No access token available')
  }

  const url = `${PROFILE_API_URL}/api/profiles/me/professional`;
  const options = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  const response = await fetchWithRetry(url, options);

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
  return data
}

export async function updateProfessionalInfo(data: Partial<ProfessionalInformation>): Promise<ProfessionalInformation> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('No access token available')
  }

  const url = `${PROFILE_API_URL}/api/profiles/me/professional`;
  const options = {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };

  const response = await fetchWithRetry(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || 'Failed to update professional information')
  }

  return response.json()
} 