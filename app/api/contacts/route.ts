import { NextResponse } from 'next/server'
import { headers, cookies } from 'next/headers'
import { refreshToken } from '@/src/services/auth'

const CONTACTS_API_URL = process.env.CONTACTS_API_URL || 'https://contacts-production-ca50.up.railway.app'
const OPPORTUNITY_API_URL = process.env.NEXT_PUBLIC_OPPORTUNITY_API_URL

interface AddressComponents {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

function parseGreekAddress(addressString: string): AddressComponents {
  const components: AddressComponents = {};
  
  // Split the address by commas
  const parts = addressString.split(',').map(part => part.trim());
  
  if (parts.length >= 1) {
    // First part is usually the street address
    components.street = parts[0];
    
    // Look for postal code in the street (if it exists)
    const postalMatch = components.street.match(/\b\d{5}\b/);
    if (postalMatch) {
      components.postalCode = postalMatch[0];
      // Remove postal code from street
      components.street = components.street.replace(postalMatch[0], '').trim();
    }
  }
  
  if (parts.length >= 2) {
    // Second part usually contains city
    components.city = parts[1].replace(/\b\d{5}\b/, '').trim(); // Remove postal code if present
    
    // Check for postal code in city part
    const cityPostalMatch = parts[1].match(/\b\d{5}\b/);
    if (cityPostalMatch && !components.postalCode) {
      components.postalCode = cityPostalMatch[0];
    }
  }
  
  // Default state for Greek addresses if not provided
  components.state = 'Macedonia';
  
  return components;
}

async function getRefreshTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('refreshToken')?.value || null
}

async function handleTokenRefresh() {
  const refreshTokenValue = await getRefreshTokenFromCookies()
  if (!refreshTokenValue) {
    throw new Error('No refresh token available')
  }

  try {
    const tokens = await refreshToken(refreshTokenValue)
    return tokens.accessToken
  } catch (error) {
    console.error('Token refresh failed:', error)
    throw new Error('Failed to refresh token')
  }
}

export async function GET(request: Request) {
  try {
    const headersList = await headers()
    const authorization = headersList.get('authorization')

    console.log('Authorization header present:', !!authorization)
    if (authorization) {
      console.log('Token format check:', {
        startsWithBearer: authorization.startsWith('Bearer '),
        tokenLength: authorization.length,
        firstChars: authorization.substring(0, 30) + '...'
      })
    }

    if (!authorization) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    let token = authorization.replace('Bearer ', '')

    const { searchParams } = new URL(request.url)
    const queryString = new URLSearchParams()

    // Forward pagination parameters
    if (searchParams.has('page')) {
      queryString.append('page', searchParams.get('page')!)
    }
    if (searchParams.has('limit')) {
      queryString.append('limit', searchParams.get('limit')!)
    }

    // Forward search parameter
    if (searchParams.has('search')) {
      queryString.append('search', searchParams.get('search')!)
    }

    const url = `${CONTACTS_API_URL}/api/contacts?${queryString}`
    
    console.log('Making request to:', url)
    
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    // If token is expired, try to refresh it
    if (response.status === 401) {
      console.log('Token expired, attempting refresh...')
      try {
        token = await handleTokenRefresh()
        console.log('Token refreshed successfully')
        
        // Retry the request with the new token
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (error) {
        console.error('Token refresh failed:', error)
        return NextResponse.json(
          { error: 'Session expired. Please log in again.' },
          { status: 401 }
        )
      }
    }

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
        console.error('Parsed error response:', errorData)
      } catch {
        console.error('Raw error response:', errorText)
        errorData = { message: errorText }
      }
      
      return NextResponse.json(
        { error: errorData.message || errorData.error || 'API request failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Detailed API Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: CONTACTS_API_URL
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const authHeader = headersList.get('authorization')?.toString()

    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    // Extract the token without the 'Bearer ' prefix if it exists
    const token = authHeader.replace('Bearer ', '')

    const body = await request.json()
    const url = `${CONTACTS_API_URL}/api/contacts`
    
    // Transform the payload to match the API requirements
    const transformedBody: {
      email: string;
      firstName: string;
      lastName: string;
      phones: Array<{
        type: string;
        number: string;
        primary: boolean;
      }>;
      address?: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
      };
      opportunityIds: string[];
    } = {
      email: body.email,
      firstName: '',
      lastName: '',
      phones: [],
      opportunityIds: []
    }

    // Add name if provided
    if (body.name) {
      const nameParts = body.name.split(' ').filter((part: string) => part.length > 0)
      if (nameParts.length > 0) {
        transformedBody.firstName = nameParts[0].trim()
        if (nameParts.length > 1) {
          transformedBody.lastName = nameParts.slice(1).join(' ').trim()
        }
      }
    }

    // Add phone if provided
    if (body.phone?.countryCode && body.phone?.number) {
      let phoneNumber = body.phone.countryCode + body.phone.number
      phoneNumber = phoneNumber.replace(/\s+/g, '').replace(/[^0-9]/g, '')
      phoneNumber = '+' + phoneNumber
      transformedBody.phones = [{
        type: "mobile",
        number: phoneNumber,
        primary: true
      }]
    }

    // Add address if provided
    if (body.address) {
      try {
        // Parse the address string
        const parsedAddress = parseGreekAddress(body.address.street || '');
        
        // Use provided values or fall back to parsed ones
        const addressData = {
          street: body.address.street || parsedAddress.street || '',
          city: body.address.city || parsedAddress.city || '',
          state: body.address.state || parsedAddress.state || 'Macedonia',
          country: body.address.country || 'GR',
          postalCode: body.address.postalCode || parsedAddress.postalCode || ''
        };

        // Validate postal code format
        if (/^\d{5}(-\d{4})?$/.test(addressData.postalCode)) {
          transformedBody.address = addressData;

          // Log address parsing results
          console.log('Address Parsing Results:', {
            original: body.address.street,
            parsed: parsedAddress,
            final: addressData
          });
        } else {
          console.log('Invalid postal code format:', addressData.postalCode);
          delete transformedBody.address;
        }
      } catch (error) {
        console.error('Address parsing error:', error);
        // Fallback to original address if parsing fails
        if (body.address.postalCode && /^\d{5}(-\d{4})?$/.test(body.address.postalCode)) {
          transformedBody.address = {
            street: body.address.street || '',
            city: body.address.city || '',
            state: body.address.state || 'Macedonia',
            country: body.address.country || 'GR',
            postalCode: body.address.postalCode
          };
        } else {
          delete transformedBody.address;
        }
      }
    }

    // Add opportunityIds if provided
    if (body.opportunityIds) {
      transformedBody.opportunityIds = body.opportunityIds
    }

    // Log the actual request to the Public Contacts API
    console.log('\n🌐 PUBLIC CONTACTS API REQUEST 🌐');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Headers:', {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token.substring(0, 10) + '...'
    });
    console.log('Body:', JSON.stringify(transformedBody, null, 2));
    console.log('----------------------------------------\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(transformedBody)
    });

    const responseText = await response.text();
    
    // Log the response from the Public Contacts API
    console.log('\n🌐 PUBLIC CONTACTS API RESPONSE 🌐');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Body:', responseText);
    console.log('----------------------------------------\n');

    if (!response.ok) {
      console.error('API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });

      let errorMessage = 'Failed to create contact';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse success response:', e);
      return NextResponse.json(
        { error: 'Invalid response from server' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Detailed error in contacts API route:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 