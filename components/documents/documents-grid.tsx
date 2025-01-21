'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { DocumentsService } from '@/lib/services/documents';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Document {
  id: string;
  title: string;
  content?: {
    type: string;
    content: any[];
  };
  createdAt: string;
  updatedAt: string;
}

export function DocumentsGrid() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setIsLoading(true);
        const documentsData = await DocumentsService.getDocuments({
          orderBy: 'updatedAt',
          order: 'desc',
          limit: '50'
        });
        setDocuments(documentsData.items || []);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch documents',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, [toast]);

  const handleCreateDocument = async () => {
    try {
      const doc = await DocumentsService.createDocument();
      router.push(`/editor?id=${doc.id}`);
      toast({
        title: 'Success',
        description: 'New document created'
      });
    } catch (error) {
      console.error('Failed to create document:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create document',
        variant: 'destructive'
      });
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleCreateDocument}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No documents found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleCreateDocument}
          >
            Create your first document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => router.push(`/editor?id=${doc.id}`)}
            >
              <h3 className="font-semibold mb-2">{doc.title}</h3>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 