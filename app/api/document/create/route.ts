import { NextResponse } from 'next/server';

const DOCUMENTS_API_URL = 'https://documents-production.up.railway.app';

export async function POST(request: Request) {
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

    // Get and validate the request body
    const bodyText = await request.text();
    console.log('Received request body:', bodyText);

    if (!bodyText) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    // Parse and validate the body
    let body;
    try {
      body = JSON.parse(bodyText);
      if (!body.title || typeof body.title !== 'string') {
        body.title = 'Untitled';
      }
      if (!body.content) {
        body.content = {
          type: "doc",
          content: [
            {
              type: "h1",
              content: [
                {
                  type: "text",
                  text: ""
                }
              ]
            }
          ]
        };
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Forward the request to the documents API
    const response = await fetch(`${DOCUMENTS_API_URL}/api/document/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upstream API error:', {
        status: response.status,
        body: errorText,
        sentBody: JSON.stringify(body)
      });
      return NextResponse.json(
        { error: 'Failed to create document in upstream service' },
        { status: response.status }
      );
    }

    // Get the response data
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 