'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getAccessToken } from '@/lib/services/auth';
import { PlateEditor, type PlateEditorProps } from '@/components/ui/plate-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { type Descendant } from 'slate';

interface DocumentPageProps {
  params: {
    id: string;
  };
}

export default function DocumentPage({ params }: DocumentPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState<{ type: 'doc', content: Descendant[] } | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch document data
  React.useEffect(() => {
    async function fetchDocument() {
      try {
        const token = getAccessToken();
        if (!token) {
          toast({
            title: "Error",
            description: "Authentication required",
            variant: "destructive"
          });
          return;
        }

        const response = await fetch(`/api/documents/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }

        const data = await response.json();
        setTitle(data.title);
        setContent(data.content);
      } catch (error) {
        console.error('Error fetching document:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch document",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocument();
  }, [params.id, toast]);

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

      const response = await fetch(`/api/documents/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update document');
      }

      toast({
        title: "Success",
        description: "Document saved successfully"
      });
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update document",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[70px]" />
            <Skeleton className="h-10 w-[70px]" />
          </div>
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

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
            Back
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <PlateEditor
          value={content?.content ?? [{ type: 'paragraph', children: [{ text: '' }] }]}
          onChange={(value: Descendant[]) => setContent({ type: 'doc', content: value })}
        />
      </div>
    </div>
  );
} 