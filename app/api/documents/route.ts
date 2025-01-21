import { NextResponse } from 'next/server';

const DOCUMENTS_API_URL = 'https://documents-production.up.railway.app';

export async function GET(request: Request) {
  try {
    // Get headers from the incoming request
    const headers = new Headers(request.headers);
    const authorization = headers.get('Authorization');

    if (!authorization) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Forward the request to the documents API
    const url = new URL(request.url);
    const queryString = url.searchParams.toString();
    const apiUrl = `${DOCUMENTS_API_URL}/api/document${queryString ? `?${queryString}` : ''}`;

    console.log('Fetching documents from:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': authorization,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Documents API error:', {
        status: response.status,
        body: errorText
      });
      return NextResponse.json(
        { error: 'Failed to fetch documents from upstream service' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 