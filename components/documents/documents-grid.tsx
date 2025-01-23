'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { DocumentsService, type Document } from '@/lib/services/documents';
import { PlusIcon } from '@heroicons/react/24/outline';

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleCreateDocument}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Document
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((doc) => (
          <Card
            key={doc.id}
            className="cursor-pointer p-4 hover:bg-muted/50"
            onClick={() => router.push(`/editor?id=${doc.id}`)}
          >
            <h3 className="font-semibold">{doc.title}</h3>
            <p className="text-sm text-muted-foreground">
              Last modified: {new Date(doc.updatedAt).toLocaleDateString()}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
} 