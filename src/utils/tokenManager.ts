// In-memory storage for access token
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

export function setAccessToken(token: string, expiresIn: number): void {
  console.log('Setting access token:', {
    tokenPreview: token ? `${token.substring(0, 10)}...` : 'null',
    expiresIn,
    expiryDate: new Date(Date.now() + (expiresIn * 1000)).toISOString()
  });
  accessToken = token;
  tokenExpiry = Date.now() + (expiresIn * 1000);
}

export function getAccessToken(): string | null {
  const now = Date.now();
  const tokenState = {
    hasToken: !!accessToken,
    hasExpiry: !!tokenExpiry,
    isExpired: tokenExpiry ? now > tokenExpiry : true,
    timeToExpiry: tokenExpiry ? Math.floor((tokenExpiry - now) / 1000) : null
  };
  
  console.log('Getting access token:', {
    ...tokenState,
    tokenPreview: accessToken ? `${accessToken.substring(0, 10)}...` : 'null',
    expiryDate: tokenExpiry ? new Date(tokenExpiry).toISOString() : null
  });

  if (!accessToken || !tokenExpiry || now > tokenExpiry) {
    console.log('Token validation failed:', tokenState);
    return null;
  }
  return accessToken;
}

export function clearAccessToken(): void {
  console.log('Clearing access token');
  accessToken = null;
  tokenExpiry = null;
}

export function isTokenExpired(): boolean {
  const expired = !tokenExpiry || Date.now() > tokenExpiry;
  console.log('Checking token expiry:', {
    hasExpiry: !!tokenExpiry,
    expiryDate: tokenExpiry ? new Date(tokenExpiry).toISOString() : null,
    isExpired: expired
  });
  return expired;
} 