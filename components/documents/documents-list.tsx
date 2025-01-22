'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { File, MoreHorizontal, Plus, Trash2, Search, Pencil } from 'lucide-react';
import { DocumentsService, type Document } from '@/lib/services/documents';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface DocumentsListRef {
  refresh: () => Promise<void>;
}

export function DocumentsList({ onRefresh }: { onRefresh?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDocumentId = searchParams?.get('id');
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [documentToDelete, setDocumentToDelete] = React.useState<Document | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState('');
  const { toast } = useToast();

  const loadDocuments = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await DocumentsService.getDocuments({
        orderBy: 'updatedAt',
        order: 'desc',
        limit: '50'
      });
      setDocuments(response.items);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh]);

  React.useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleCopyLink = (id: string) => {
    try {
      const url = `${window.location.origin}/editor?id=${id}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Success",
        description: "Link copied to clipboard"
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleOpenInNewTab = (id: string) => {
    window.open(`/editor?id=${id}`, '_blank');
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    try {
      await DocumentsService.deleteDocument(id);
      await loadDocuments();
      setDocumentToDelete(null);
      toast({
        title: 'Success',
        description: 'Document moved to trash'
      });
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to move document to trash',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateTitle = async (id: string, newTitle: string) => {
    try {
      await DocumentsService.updateDocument(id, { title: newTitle });
      await loadDocuments();
      toast({
        title: 'Success',
        description: 'Document title updated'
      });
    } catch (error) {
      console.error('Failed to update document title:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update document title',
        variant: 'destructive'
      });
    }
    setEditingId(null);
  };

  const startRenaming = (doc: Document) => {
    setEditingId(doc.id);
    setEditingTitle(doc.title);
    setOpenMenuId(null);
  };

  const handleCreateDocument = async () => {
    try {
      const doc = await DocumentsService.createDocument();
      if (doc) {
        router.push(`/documents/${doc.id}`);
        toast({
          title: 'Success',
          description: 'New document created'
        });
      }
    } catch (error) {
      console.error('Failed to create document:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create document',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-sm text-muted-foreground">Loading documents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <div className="text-sm text-destructive">{error}</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="max-h-[50vh]">
        <div className="flex flex-col py-1">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group relative flex items-center"
              onMouseEnter={() => setHoveredId(doc.id)}
              onMouseLeave={() => {
                if (openMenuId !== doc.id) {
                  setHoveredId(null);
                }
              }}
            >
              {editingId === doc.id ? (
                <form
                  className="flex w-full items-center gap-2 px-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateTitle(doc.id, editingTitle);
                  }}
                >
                  <Input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => {
                      if (editingTitle !== doc.title) {
                        handleUpdateTitle(doc.id, editingTitle);
                      } else {
                        setEditingId(null);
                        setEditingTitle('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditingTitle('');
                      }
                    }}
                    className="h-8"
                  />
                </form>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2 font-normal rounded-none px-4 py-1.5",
                      "hover:bg-secondary hover:text-secondary-foreground",
                      currentDocumentId === doc.id && "bg-secondary text-secondary-foreground"
                    )}
                    onClick={() => router.push(`/editor?id=${doc.id}`)}
                  >
                    <File className="size-6" />
                    <span className="truncate">{doc.title}</span>
                  </Button>
                  {(hoveredId === doc.id || openMenuId === doc.id) && (
                    <div 
                      className="absolute right-1 flex items-center gap-0.5 mr-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex h-6 w-6 items-center justify-center hover:bg-muted"
                      >
                        <Plus className="size-4" />
                      </Button>
                      <DropdownMenu
                        open={openMenuId === doc.id}
                        onOpenChange={(open) => {
                          setOpenMenuId(open ? doc.id : null);
                          if (!open) {
                            setHoveredId(null);
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex h-6 w-6 items-center justify-center hover:bg-muted"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-48"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem onClick={() => handleCopyLink(doc.id)}>
                            Copy link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startRenaming(doc)}>
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenInNewTab(doc.id)}>
                            Open in new tab
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            onClick={() => {
                              setDocumentToDelete(doc);
                              setOpenMenuId(null);
                            }}
                          >
                            <Trash2 className="size-4" />
                            Move to trash
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {documents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                You don&apos;t have any documents yet.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleCreateDocument}
              >
                Create your first document
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <AlertDialog 
        open={documentToDelete !== null}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move &quot;{documentToDelete?.title}&quot; to trash. You can restore it later from the trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleDelete(documentToDelete?.id || '')}
            >
              Move to trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 