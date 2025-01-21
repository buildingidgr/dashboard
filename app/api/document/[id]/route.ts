import { NextResponse } from 'next/server';

const DOCUMENTS_API_URL = 'https://documents-production.up.railway.app';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const response = await fetch(`${DOCUMENTS_API_URL}/api/document/${params.id}`, {
      headers: {
        'Authorization': authorization,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Document API error:', {
        status: response.status,
        body: errorText
      });
      return NextResponse.json(
        { error: 'Failed to fetch document from upstream service' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    console.log('Received raw body:', bodyText);
    
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    console.log('Parsed body:', JSON.stringify(body, null, 2));

    interface DocumentContent {
      content?: DocumentContent | DocumentContent[];
      [key: string]: any;
    }

    // Helper function to find the actual content array if it exists
    const findContentArray = (obj: DocumentContent): DocumentContent[] | undefined => {
      if (!obj) return undefined;
      if (Array.isArray(obj)) return obj;
      if (obj?.content) return findContentArray(obj.content);
      return undefined;
    };

    // Transform the body only if content exists
    const transformedBody: DocumentContent = {
      title: body.title
    };

    if (body.content) {
      const contentArray = findContentArray(body.content);
      if (contentArray) {
        transformedBody.content = {
          type: 'doc',
          content: contentArray
        };
      }
    }

    console.log('Transformed body:', JSON.stringify(transformedBody, null, 2));

    // Forward the request to the documents API
    const response = await fetch(`${DOCUMENTS_API_URL}/api/document/${params.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': authorization,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transformedBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Document API error:', {
        status: response.status,
        body: errorText
      });
      return NextResponse.json(
        { error: 'Failed to update document in upstream service' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const response = await fetch(`${DOCUMENTS_API_URL}/api/document/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authorization,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Document API error:', {
        status: response.status,
        body: errorText
      });
      return NextResponse.json(
        { error: 'Failed to delete document from upstream service' },
        { status: response.status }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 