import { setAccessToken } from '@/src/utils/tokenManager';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function exchangeClerkToken(sessionToken: string, userId: string): Promise<TokenResponse> {
  console.log('Starting Clerk token exchange:', {
    sessionTokenPreview: sessionToken ? `${sessionToken.substring(0, 10)}...` : 'null',
    userId
  });
  
  const apiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;
  
  if (!apiUrl) {
    console.error('AUTH_API_URL not configured');
    throw new Error('AUTH_API_URL is not configured');
  }

  console.log('Making token exchange request to:', `${apiUrl}/v1/token/clerk/exchange`);
  const response = await fetch(`${apiUrl}/v1/token/clerk/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      sessionId: sessionToken,
      userId
    }),
  });

  console.log('Token exchange response:', {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token exchange failed:', {
      status: response.status,
      error: errorText
    });
    throw new Error(`Failed to exchange token: ${response.status}`);
  }

  const data = await response.json();
  console.log('Token exchange successful:', {
    accessTokenPreview: data.access_token ? `${data.access_token.substring(0, 10)}...` : 'null',
    expiresIn: data.expires_in
  });
  
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in
  };
}

export async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  console.log('Starting token refresh...');
  const apiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;
  
  if (!apiUrl) {
    console.error('AUTH_API_URL not configured');
    throw new Error('AUTH_API_URL is not configured');
  }

  try {
    console.log('Making token refresh request to:', `${apiUrl}/v1/token/refresh`);
    const response = await fetch(`${apiUrl}/v1/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({
        refreshToken
      }),
    });

    console.log('Token refresh response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', {
        status: response.status,
        error: errorText
      });
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || 'Failed to refresh token');
    }

    const data = await response.json();
    console.log('Token refresh successful:', {
      accessTokenPreview: data.access_token ? `${data.access_token.substring(0, 10)}...` : 'null',
      expiresIn: data.expires_in
    });

    return data;
  } catch (error) {
    console.error('Token refresh failed:', {
      apiUrl,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}