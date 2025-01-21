// Auth Service Configuration
// Base URL: https://auth-service-production-16ee.up.railway.app
// This service handles token exchange between Clerk authentication and our system
// Environment variable: NEXT_PUBLIC_AUTH_API_URL

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  error?: string;
}

// Token storage functions
export const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
};

export const setAccessToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
};

export const getAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('accessToken');
  if (!validateToken(token)) {
    localStorage.removeItem('accessToken');
    return null;
  }

  return token;
};

export const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

// Token validation
const validateToken = (token: string | null): boolean => {
  if (!token || token === 'undefined') return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const [, payload] = parts;
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check token expiration with 60 second buffer
    const expirationBuffer = 60 * 1000; // 60 seconds in milliseconds
    const isExpired = Date.now() >= (decodedPayload.exp * 1000) - expirationBuffer;
    
    // Validate token type and required fields
    const isValid = !isExpired && 
      decodedPayload.sub && 
      decodedPayload.type === 'access' &&
      typeof decodedPayload.exp === 'number';
    
    if (!isValid) {
      localStorage.removeItem('accessToken');
    }
    
    return isValid;
  } catch {
    localStorage.removeItem('accessToken');
    return false;
  }
};

// Token exchange with Clerk
export const exchangeClerkToken = async (sessionId: string, userId: string): Promise<TokenResponse> => {
  if (!sessionId || !userId) {
    throw new Error('Session ID and User ID are required for token exchange');
  }

  try {
    const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://auth-service-production-16ee.up.railway.app';
    
    if (!authApiUrl) {
      throw new Error('Auth API URL is not configured');
    }

    const url = `${authApiUrl}/v1/token/clerk/exchange`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ sessionId, userId }),
    });

    const responseData = await response.text();
    let parsedData: TokenResponse;

    try {
      parsedData = JSON.parse(responseData);
    } catch (e) {
      console.error('Failed to parse auth service response:', responseData);
      throw new Error('Invalid response from auth service');
    }

    if (!response.ok) {
      throw new Error(parsedData.error || `Token exchange failed: ${response.statusText}`);
    }

    if (!parsedData.access_token || !parsedData.refresh_token) {
      throw new Error('Invalid token response from auth service');
    }

    // Store tokens
    setTokens(parsedData.access_token, parsedData.refresh_token);
    
    // Verify token was stored and is valid
    const storedToken = getAccessToken();
    if (!validateToken(storedToken)) {
      throw new Error('Failed to store valid access token');
    }

    return parsedData;
  } catch (error) {
    console.error('Token exchange failed:', error);
    throw error;
  }
};

// Auth headers for API requests
export const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log('Auth headers for API request:', headers);
    return headers;
  }
  return {};
};

// Token refresh
export const refreshToken = async (token: string): Promise<TokenResponse> => {
  try {
    const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://auth-service-production-16ee.up.railway.app';
    if (!authApiUrl) {
      throw new Error('Auth API URL is not configured');
    }

    console.log('Starting token refresh...');

    const response = await fetch(`${authApiUrl}/v1/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to refresh token');
    }

    const tokens = await response.json();
    setTokens(tokens.access_token, tokens.refresh_token);

    return tokens;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

// Debug utility
export const debugToken = () => {
  const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://auth-service-production-16ee.up.railway.app';
  console.log('Auth Server URL:', authApiUrl);

  const token = getAccessToken();
  if (!token) {
    console.log('No access token found');
    return;
  }

  console.log('Current access token:', token);
  console.log('Token format:', {
    length: token.length,
    startsWithBearer: token.startsWith('Bearer '),
    hasThreeParts: token.split('.').length === 3
  });

  try {
    const [, payload] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    console.log('Token payload:', decodedPayload);
    console.log('Token expires:', new Date(decodedPayload.exp * 1000));
  } catch (error) {
    console.error('Failed to decode token:', error);
  }
}; 