# Files and Documents API Implementation Guide

## Database Schema

### File Collection
```typescript
interface File {
  id: string;                 // Unique identifier
  userId: string;            // Reference to user who owns the file
  name: string;              // Original filename
  type: string;              // File MIME type
  size: number;              // File size in bytes
  url: string;               // S3 file URL
  key: string;               // S3 file key
  uploadedAt: Date;          // Upload timestamp
  updatedAt: Date;           // Last modification timestamp
}

interface Document {
  id: string;                // Unique identifier
  userId: string;           // Reference to user who owns the document
  title: string;            // Document title
  content: {               // Document content in ProseMirror format
    type: string;
    content: Array<{
      type: string;
      children: Array<{ text: string }>
    }>
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### Files API

#### 1. Get Upload URL
```typescript
POST /api/upload

Request Body:
{
  fileName: string;    // Original file name
  fileType: string;    // File MIME type
  fileSize: number;    // File size in bytes
}

Response:
{
  fileId: string;      // Unique file identifier
  uploadUrl: string;   // S3 bucket URL
  fields: {           // S3 pre-signed POST fields
    'Content-Type': string;
    bucket: string;
    'X-Amz-Algorithm': string;
    'X-Amz-Credential': string;
    'X-Amz-Date': string;
    key: string;
    Policy: string;
    'X-Amz-Signature': string;
  }
}
```

#### 2. Upload to S3
```typescript
POST {uploadUrl}

// Use multipart/form-data with fields from the pre-signed URL response
FormData:
- Content-Type
- bucket
- X-Amz-Algorithm
- X-Amz-Credential
- X-Amz-Date
- key
- Policy
- X-Amz-Signature
- file (binary)
```

#### 3. List Files
```typescript
GET /api/files

Response:
{
  files: File[];
}
```

#### 4. Get File
```typescript
GET /api/files/:fileId

Response:
{
  file: File;
}
```

### Documents API

#### 1. List Documents
```typescript
GET /api/documents

Query Parameters:
- limit: number (default: 10)
- cursor: string
- orderBy: string (default: 'updatedAt')
- order: 'asc' | 'desc' (default: 'desc')

Response:
{
  documents: Document[];
  nextCursor?: string;
}
```

#### 2. Create Document
```typescript
POST /api/documents

Request Body:
{
  title: string;
  content: {
    type: string;
    content: Array<{
      type: string;
      children: Array<{ text: string }>
    }>
  }
}

Response:
{
  document: Document;
}
```

#### 3. Get Document
```typescript
GET /api/documents/:documentId

Response:
{
  document: Document;
}
```

## Implementation Steps

1. **Setup**
   - Configure AWS S3 credentials
   - Set up database schema
   - Create API routes

2. **File Upload Implementation**
   - Create endpoint for generating pre-signed URLs
   - Implement S3 upload handling
   - Add file metadata tracking

3. **Document Management**
   - Implement document CRUD operations
   - Add content validation
   - Set up pagination

4. **Frontend Integration**
   - Create upload component with pre-signed URL flow
   - Implement document editor
   - Add file/document listings

## Security Considerations

1. **S3 Security**
   - Use pre-signed URLs with expiration
   - Configure proper CORS settings
   - Set appropriate bucket policies

2. **Access Control**
   - Implement authentication middleware
   - Verify file/document ownership
   - Validate file types and sizes

3. **Rate Limiting**
   - Implement API rate limiting
   - Add upload size restrictions

## Error Handling

### Common Error Codes
```typescript
enum ApiError {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}
```

### Error Responses
```typescript
{
  error: ApiError;
  message: string;
  details?: any;
}
```

## Required Environment Variables
```bash
AWS_REGION=your_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name
```

## Example Frontend Implementation
```typescript
async function uploadFile(file: File) {
  try {
    // 1. Get pre-signed URL
    const { fileId, uploadUrl, fields } = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
    }).then(res => res.json());

    // 2. Upload to S3
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append('file', file);

    await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    return fileId;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
``` 