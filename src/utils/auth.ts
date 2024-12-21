import { refreshToken } from '../services/auth';

export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

export function isTokenExpired(): boolean {
  const expiry = localStorage.getItem('tokenExpiry');
  if (!expiry) return true;
  return Date.now() > parseInt(expiry);
}

export function setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('tokenExpiry', (Date.now() + expiresIn * 1000).toString());
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
}

export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = getAccessToken();
  
  if (accessToken && !isTokenExpired()) {
    return accessToken;
  }

  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    clearTokens();
    return null;
  }

  try {
    const tokens = await refreshToken(currentRefreshToken);
    setTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
    return tokens.accessToken;
  } catch (error) {
    clearTokens();
    return null;
  }
} 