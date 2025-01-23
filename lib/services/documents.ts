import { getAccessToken } from '@/lib/services/auth';
import { type TElement } from '@udecode/plate-common';

export interface Document {
  id: string;
  title: string;
  content?: {
    type: string;
    content: TElement[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  totalCount: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface GetDocumentsResponse {
  items: Document[];
  pagination: PaginationInfo;
}

export class DocumentsService {
  private static readonly API_URL = '/api';

  static async getDocuments(params?: { 
    orderBy?: string; 
    order?: string;
    cursor?: string;
    limit?: string;
  }): Promise<GetDocumentsResponse> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const queryParams = new URLSearchParams();
    if (params?.orderBy) queryParams.set('orderBy', params.orderBy);
    if (params?.order) queryParams.set('order', params.order);
    if (params?.cursor) queryParams.set('cursor', params.cursor);
    if (params?.limit) queryParams.set('limit', params.limit);

    const url = `${this.API_URL}/documents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  }

  static async getDocument(id: string): Promise<Document | null> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`Fetching document ${id}...`);
    try {
      const response = await fetch(`${this.API_URL}/document/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }

      const doc = await response.json();
      console.log('Document fetched successfully:', {
        id: doc.id,
        title: doc.title,
        contentType: doc.content?.type,
        hasContent: !!doc.content,
        contentLength: doc.content?.content?.length
      });
      
      // Return the document as is - it already has the correct structure
      return doc;
    } catch (error: unknown) {
      console.error('Error fetching document:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  static async createDocument(title?: string): Promise<Document> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const documentData = {
      title: title || "Untitled",
      content: {
        type: "doc",
        content: [
          {
            type: "h1",
            children: [
              {
                text: ""
              }
            ]
          },
          {
            type: "paragraph",
            children: [
              {
                text: ""
              }
            ]
          }
        ] as TElement[]
      }
    };

    console.debug('Creating document with data:', JSON.stringify(documentData, null, 2));

    const response = await fetch(`${this.API_URL}/document/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(documentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create document';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', errorText, 'Error:', parseError);
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  static async updateDocument(id: string, data: Partial<Document>): Promise<Document> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Only wrap in doc type if it's a raw array
    const updateData: Partial<Document> = {};
    
    // Only include fields that are provided
    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    
    if (data.content !== undefined) {
      updateData.content = Array.isArray(data.content) ? {
        type: "doc",
        content: data.content
      } : data.content;
    }

    console.log('Updating document with data:', updateData);

    const response = await fetch(`${this.API_URL}/document/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update document error:', errorText);
      throw new Error('Failed to update document');
    }

    return response.json();
  }

  static async deleteDocument(id: string): Promise<void> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.API_URL}/document/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete document error:', errorText);
      throw new Error('Failed to delete document');
    }
  }
} 