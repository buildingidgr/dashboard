import { getAccessToken } from '@/lib/services/auth';

export interface Document {
  id: string;
  title: string;
  content?: {
    type: string;
    content: any[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetDocumentsResponse {
  items: Document[];
  total: number;
}

export class DocumentsService {
  private static readonly API_URL = '/api';

  static async getDocuments(params?: { orderBy?: string; order?: string; limit?: string }): Promise<GetDocumentsResponse> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const queryParams = new URLSearchParams();
    if (params?.orderBy) queryParams.set('orderBy', params.orderBy);
    if (params?.order) queryParams.set('order', params.order);
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

  static async getDocument(id: string): Promise<Document> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`Fetching document ${id}...`);
    const response = await fetch(`${this.API_URL}/document/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch document:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error('Failed to fetch document');
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
        ]
      }
    };

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
      } catch (e) {
        console.error('Failed to parse error response:', errorText);
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