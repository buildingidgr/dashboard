# Authentication Flow Documentation

## Overview

This document explains how we handle authentication using Clerk and exchange tokens for accessing our backend API.

## Token Exchange Flow

1. **Initial Authentication with Clerk**
   - User signs in through Clerk's UI
   - Clerk provides a session token
   - We get the session ID and user ID from Clerk

2. **Token Exchange Process**
   ```typescript
   // Example from app/claimed/page.tsx
   const initializeTokenAndFetch = async () => {
     try {
       let token = getAccessToken() // First check local storage
       if (!token) {
         const tokens = await exchangeClerkToken(session.id, user?.id)
         token = tokens.accessToken
       }
       // Use token for API requests
     } catch (error) {
       console.error('Failed to initialize token:', error)
     }
   }
   ```

3. **Token Storage**
   - Access tokens are stored in localStorage
   - Managed through `src/utils/tokenManager.ts`
   ```typescript
   export function getAccessToken(): string | null {
     return localStorage.getItem('access_token')
   }

   export function setAccessToken(token: string): void {
     localStorage.setItem('access_token', token)
   }
   ```

4. **API Request Flow**
   ```typescript
   // Example API request with token
   const response = await fetch('/api/opportunities/my-changes', {
     headers: {
       'Accept': 'application/json',
       'Authorization': `Bearer ${token}`
     }
   })
   ```

## Key Components

### 1. Token Exchange Service
```typescript
// src/services/auth.ts
export async function exchangeClerkToken(sessionId: string, userId: string) {
  const response = await fetch('/api/auth/exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      userId,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange token')
  }

  const tokens = await response.json()
  setAccessToken(tokens.accessToken) // Store in localStorage
  return tokens
}
```

### 2. Protected API Routes
```typescript
// Example from app/api/opportunities/my-changes/route.ts
export async function GET(request: Request) {
  const headers = new Headers(request.headers)
  const token = headers.get('authorization')?.split(' ')[1]

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Forward request to backend with token
  const response = await fetch(`${process.env.NEXT_PUBLIC_OPPORTUNITY_API_URL}/my-changes`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  return response
}
```

## Security Considerations

1. **Token Storage**
   - Access tokens are stored in localStorage
   - Should be treated as sensitive data
   - Clear tokens on logout

2. **Token Expiration**
   - Tokens have an expiration time
   - Need to handle token refresh flow
   - Redirect to login when tokens are invalid

3. **HTTPS**
   - All API requests must be made over HTTPS
   - Ensures tokens are transmitted securely

## Best Practices

1. **Error Handling**
   ```typescript
   try {
     const token = await exchangeClerkToken(sessionId, userId)
   } catch (error) {
     console.error('Token exchange failed:', error)
     // Handle error appropriately
     // e.g., redirect to login, show error message
   }
   ```

2. **Token Validation**
   - Always validate tokens before use
   - Check expiration
   - Verify token format

3. **Logout Handling**
   ```typescript
   function handleLogout() {
     localStorage.removeItem('access_token')
     // Additional cleanup
     // Redirect to login page
   }
   ```

## Common Issues and Solutions

1. **401 Unauthorized Errors**
   - Check if token exists
   - Verify token format
   - Ensure token hasn't expired
   - Try re-authenticating user

2. **Token Exchange Failures**
   - Verify Clerk session is valid
   - Check network connectivity
   - Ensure correct environment variables

3. **Missing Tokens**
   - Implement proper error handling
   - Redirect to login when needed
   - Clear invalid tokens

## Environment Setup

Required environment variables:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_OPPORTUNITY_API_URL=your_api_url
```

## Testing Authentication

1. **Manual Testing**
   - Test login flow
   - Verify token exchange
   - Check protected routes
   - Test token expiration
   - Verify logout cleanup

2. **Automated Testing**
   ```typescript
   describe('Authentication Flow', () => {
     it('should exchange Clerk token for access token', async () => {
       // Test implementation
     })

     it('should handle token exchange errors', async () => {
       // Test implementation
     })
   })
   ``` 