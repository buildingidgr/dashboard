'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAccessToken } from '@/lib/services/auth';
import { PlateEditor } from '@/components/ui/plate-editor';
import { type Descendant } from 'slate';

export default function NewDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState('Untitled');
  const [content, setContent] = React.useState<Descendant[]>([
    {
      type: 'paragraph',
      children: [{ text: '' }]
    }
  ]);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = getAccessToken();
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: {
            type: 'doc',
            content
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const { documentId } = await response.json();
      router.push(`/documents/${documentId}`);
      toast({
        title: "Success",
        description: "Document created successfully"
      });
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create document",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold h-auto px-0 border-0 focus-visible:ring-0"
              placeholder="Untitled"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/documents')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <PlateEditor
          value={content}
          onChange={(value: Descendant[]) => setContent(value)}
        />
      </div>
    </div>
  );
} 