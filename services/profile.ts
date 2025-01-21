import { getAccessToken } from '@/lib/services/auth';

function getAuthHeaders() {
  const token = getAccessToken();
  return {
    'Authorization': `Bearer ${token}`
  };
}

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

interface ProfessionalInfo {
  company: string
  position: string
  industry: string
  experience: number
}

interface Preferences {
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  theme: 'light' | 'dark'
  language: string
}

export const getProfile = async (): Promise<ProfileData> => {
  const headers = getAuthHeaders()
  const response = await fetch('/api/profile', { 
    headers: headers as HeadersInit 
  })
  if (!response.ok) throw new Error('Failed to fetch profile')
  return response.json()
}

export const updateProfile = async (data: Partial<ProfileData>): Promise<ProfileData> => {
  const headers = getAuthHeaders()
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      ...headers as Record<string, string>,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to update profile')
  return response.json()
}

export const getProfessionalInfo = async (): Promise<ProfessionalInfo> => {
  const headers = getAuthHeaders()
  const response = await fetch('/api/profile/professional', { 
    headers: headers as HeadersInit 
  })
  if (!response.ok) throw new Error('Failed to fetch professional info')
  return response.json()
}

export const updateProfessionalInfo = async (data: Partial<ProfessionalInfo>): Promise<ProfessionalInfo> => {
  const headers = getAuthHeaders()
  const response = await fetch('/api/profile/professional', {
    method: 'PUT',
    headers: {
      ...headers as Record<string, string>,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to update professional info')
  return response.json()
}

export const getPreferences = async (): Promise<Preferences> => {
  const headers = getAuthHeaders()
  const response = await fetch('/api/profile/preferences', { 
    headers: headers as HeadersInit 
  })
  if (!response.ok) throw new Error('Failed to fetch preferences')
  return response.json()
}

export const updatePreferences = async (data: Partial<Preferences>): Promise<Preferences> => {
  const headers = getAuthHeaders()
  const response = await fetch('/api/profile/preferences', {
    method: 'PUT',
    headers: {
      ...headers as Record<string, string>,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to update preferences')
  return response.json()
} 