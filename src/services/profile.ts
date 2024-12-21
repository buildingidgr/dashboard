import { getAccessToken } from '@/src/utils/tokenManager';

export interface Profile {
  _id: string;
  clerkId: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  phoneVerified: boolean;
  username: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalInfo {
  profession: {
    current: string;
    allowedValues: string[];
  };
  amtee: string;
  areaOfOperation: {
    primary: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
}

export async function getProfile(): Promise<Profile> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

export async function updateProfile(data: Partial<Pick<Profile, 'firstName' | 'lastName' | 'avatarUrl'>>): Promise<Profile> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/me`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  return response.json();
}

export async function getProfessionalInfo(): Promise<ProfessionalInfo> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/me/professional`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch professional info');
  }

  return response.json();
}

export async function updateProfessionalInfo(data: Partial<ProfessionalInfo>): Promise<ProfessionalInfo> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/me/professional`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update professional info');
  }

  return response.json();
}

export async function getPreferences(): Promise<any> {
    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new Error('No access token available');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/me/preferences`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch preferences');
    }

    return response.json();
}

export async function updatePreferences(data: any): Promise<any> {
    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new Error('No access token available');
    }

    console.log('Sending preferences update with data:', JSON.stringify(data, null, 2));

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/me/preferences`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const responseData = await response.json();
    console.log('Preferences update response:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update preferences');
    }

    return responseData;
}