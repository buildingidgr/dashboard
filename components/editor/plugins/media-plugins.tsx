'use client';

import { CaptionPlugin } from '@udecode/plate-caption/react';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from '@udecode/plate-media/react';
import { toast } from 'sonner';

import { ImagePreview } from '@/components/plate-ui/image-preview';
import { MediaUploadToast } from '@/components/plate-ui/media-upload-toast';
import { getAccessToken } from '@/lib/services/auth';

async function uploadImageFile(file: File, onProgress?: (progress: number) => void) {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    onProgress?.(20); // Start progress

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
    onProgress?.(50); // File uploaded, processing

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

    onProgress?.(80); // Almost done

    // Get the file details
    const fileResponse = await fetch(`/api/files/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!fileResponse.ok) {
      throw new Error('Failed to get file details');
    }

    const { file: uploadedFile } = await fileResponse.json();
    onProgress?.(100); // Complete

    return {
      url: uploadedFile.url,
      name: uploadedFile.name,
    };
  } catch (error) {
    console.error('Upload error:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to upload file');
    throw error;
  }
}

export const mediaPlugins = [
  ImagePlugin.extend({
    options: { 
      disableUploadInsert: false,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      acceptMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
      uploadFile: async (file: File, { setProgress }: { setProgress: (progress: number) => void }) => {
        return uploadImageFile(file, setProgress);
      },
    },
    render: { afterEditable: ImagePreview },
  }),
  MediaEmbedPlugin,
  VideoPlugin,
  AudioPlugin,
  FilePlugin,
  CaptionPlugin.configure({
    options: {
      plugins: [
        ImagePlugin,
        VideoPlugin,
        AudioPlugin,
        FilePlugin,
        MediaEmbedPlugin,
      ],
    },
  }),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast },
  }),
] as const;
