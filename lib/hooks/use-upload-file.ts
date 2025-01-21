import { useState } from 'react';
import { toast } from 'sonner';
import { getAccessToken } from '@/lib/services/auth';

interface FileResponse {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  key: string;
  status: string;
  uploadedAt: string;
  updatedAt: string;
}

export function useUploadFile() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);

  const uploadFile = async (file: File): Promise<{ url: string; name: string }> => {
    try {
      setIsUploading(true);
      setUploadingFile(file);
      setProgress(0);
      setUploadedFile(null);

      const token = getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      setProgress(20); // Start progress

      // Upload to our API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const { fileId } = await response.json();
      setProgress(50); // File uploaded, processing

      // Complete the upload
      const completeResponse = await fetch(`/api/files/${fileId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete file upload');
      }

      setProgress(80); // Almost done

      // Get the file details
      const fileResponse = await fetch(`/api/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!fileResponse.ok) {
        throw new Error('Failed to get file details');
      }

      const fileData = await fileResponse.json() as FileResponse;
      setProgress(100); // Complete

      // Check if the response has the expected structure
      if (!fileData?.url) {
        console.error('Unexpected API response:', fileData);
        throw new Error('Invalid file data received from server');
      }

      const result = {
        url: fileData.url,
        name: fileData.name || file.name, // Fallback to original filename if server doesn't provide one
      };
      
      setUploadedFile(result);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
      throw error;
    } finally {
      setIsUploading(false);
      setUploadingFile(null);
    }
  };

  return {
    isUploading,
    progress,
    uploadFile,
    uploadedFile,
    uploadingFile,
  };
} 