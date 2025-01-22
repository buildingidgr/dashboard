'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';

import { Plate } from '@udecode/plate-common/react';
import { type Value, type TElement, type TDescendant } from '@udecode/plate-common';
import { ParagraphPlugin } from '@udecode/plate-common/react';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Editor } from '@/components/plate-ui/editor';
import { FixedToolbar } from '@/components/plate-ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/plate-ui/fixed-toolbar-buttons';
import { DocumentsService } from '@/lib/services/documents';
import { DocumentWebSocket } from '@/lib/services/websocket';
import { getAccessToken } from '@/lib/services/auth';
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentMetadata } from '@/components/document-metadata';

function safeStringify(value: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(value, (key, val) => {
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) {
        return undefined; // Remove circular reference
      }
      seen.add(val);
    }
    return val;
  });
}

function validateContent(content: unknown): content is TElement[] {
  if (!Array.isArray(content)) return false;
  return content.every(node => {
    if (!node || typeof node !== 'object') return false;
    if (!('type' in node) || typeof node.type !== 'string') return false;
    if (!('children' in node) || !Array.isArray(node.children)) return false;
    return node.children.every((child: unknown) => {
      if (!child || typeof child !== 'object') return false;
      if ('text' in child && typeof (child as { text: unknown }).text === 'string') return true;
      return validateContent([child]);
    });
  });
}

export function PlateEditor() {
  const editor = useCreateEditor();
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams?.get('id');

  const [title, setTitle] = React.useState('Untitled');
  const [ws, setWs] = React.useState<DocumentWebSocket | null>(null);
  const [isLoading, setIsLoading] = React.useState(!!documentId);

  // Track last saved content by block ID
  const lastContentRef = React.useRef<Record<string, unknown>>({});

  // Initialize last content state when document is loaded
  React.useEffect(() => {
    if (!documentId || !editor) return;

    setIsLoading(true);
    DocumentsService.getDocument(documentId)
      .then((doc) => {
        if (!doc) throw new Error('Document not found');
        
        setTitle(doc.title);

        if (doc.content?.content) {
          try {
            // Validate content structure
            const content = doc.content.content;
            if (!validateContent(content)) {
              throw new Error('Invalid document content structure');
            }

            // Use editor transform to set content
            editor.insertFragment(content);
            
            // Initialize the last content state
            lastContentRef.current.lastSavedContent = safeStringify(content);
          } catch (error) {
            console.error('Failed to process document content:', error);
            toast.error('Failed to load document content properly.');
            
            // Set default content as fallback
            const defaultContent: TElement[] = [{
              type: ParagraphPlugin.key,
              children: [{ text: '' }]
            }];
            editor.insertFragment(defaultContent);
          }
        } else {
          // Set default content
          const defaultContent: TElement[] = [{
            type: ParagraphPlugin.key,
            children: [{ text: '' }]
          }];
          editor.insertFragment(defaultContent);
        }
      })
      .catch((error) => {
        console.error('Failed to load document:', error);
        if (error.message === 'No authentication token found') {
          toast.error('Authentication required. Please log in again.');
          router.push('/login');
        } else {
          toast.error('Failed to load document. Please try again.');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [documentId, editor, router]);

  // Handle content changes for real-time collaboration only
  const handleContentChange = React.useCallback(() => {
    // Currently only used for triggering editor updates
    // No need to call onChange() here as it will create an infinite loop
  }, []); // Removed editor dependency as it's not used

  // Save document periodically via HTTP API
  React.useEffect(() => {
    if (!documentId || !editor) return;

    const saveDocument = async () => {
      if (!editor.children || editor.children.length === 0) {
        console.log('Editor is empty, skipping save');
        return;
      }

      // Check if content is just empty paragraphs
      const isOnlyEmptyParagraphs = editor.children.every((block) => {
        if (block.type !== ParagraphPlugin.key) return false;
        if (!block.children || block.children.length === 0) return true;
        if (block.children.length !== 1) return false;
        
        const textNode = block.children[0];
        if (!textNode || typeof textNode !== 'object') return true;
        if (!('text' in textNode) || typeof textNode.text !== 'string') return true;
        return textNode.text.trim() === '';
      });

      if (isOnlyEmptyParagraphs) {
        console.log('Content contains only empty paragraphs, skipping save');
        return;
      }

      // Store the last saved content string on first run
      if (!lastContentRef.current.lastSavedContent) {
        lastContentRef.current.lastSavedContent = safeStringify(editor.children);
        return;
      }

      // Compare with last saved content
      const currentContentString = safeStringify(editor.children);
      if (currentContentString === lastContentRef.current.lastSavedContent) {
        console.log('No changes detected in content, skipping save');
        return;
      }

      try {
        console.log('Content changed, saving document...');
        
        // Update our reference immediately to prevent duplicate saves
        lastContentRef.current.lastSavedContent = currentContentString;

        const payload = {
          content: {
            type: 'doc',
            content: editor.children as TElement[]
          }
        };
        await DocumentsService.updateDocument(documentId, payload);
      } catch (error) {
        console.error('Failed to save document:', error);
        toast.error('Failed to save document. Please try again.');
      }
    };

    const interval = setInterval(saveDocument, 2000);
    return () => clearInterval(interval);
  }, [documentId, editor]);

  // Initialize WebSocket connection
  React.useEffect(() => {
    let isInitializing = false;
    let websocket: DocumentWebSocket | null = null;

    const initializeWebSocket = async () => {
      if (isInitializing || !documentId) return;

      const token = await getAccessToken();
      if (!token) {
        console.error('No authentication token found');
        toast.error('Authentication required. Please log in again.');
        router.push('/login');
        return;
      }

      isInitializing = true;
      
      try {
        websocket = new DocumentWebSocket(
          documentId,
          token,
          // Update handler
          (data) => {
            console.log('WebSocket update received:', data);
            if (editor && data.content?.content) {
              try {
                // Use editor transform to set content
                const content = data.content.content;
                editor.insertFragment(content);
              } catch (error) {
                console.error('Failed to update editor content:', error);
              }
            }
          },
          // Cursor handler
          (userId, position) => {
            console.debug('WebSocket: Cursor update', { userId, position });
          },
          // Presence handler
          (userId, status) => {
            console.debug('WebSocket: Presence update', { userId, status });
          }
        );
        setWs(websocket);
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        toast.error('Failed to establish real-time connection. Changes will not be synchronized.');
      } finally {
        isInitializing = false;
      }
    };

    initializeWebSocket();

    return () => {
      if (websocket) {
        websocket.disconnect();
        setWs(null);
      }
    };
  }, [documentId, editor, router]);

  // Handle visibility changes
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (ws) {
        if (document.hidden) {
          ws.sendPresence('idle');
        } else {
          if (!ws.isConnected()) {
            toast.error('Connection lost. Please refresh the page.');
          } else {
            ws.sendPresence('online');
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [ws]);

  if (isLoading) {
    return (
      <div className="size-full p-16 space-y-4">
        <Skeleton className="mb-8 h-7 w-3/4" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Plate editor={editor} onChange={handleContentChange}>
        <div className="flex h-screen flex-col">
          {/* Sticky header section */}
          <div className="sticky top-0 z-50 bg-background">
            <DocumentMetadata
              title={title}
              editedAt="Just now"
              editedBy="You"
              createdBy="You"
              createdAt="Today"
              onTitleChange={setTitle}
            />
            <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
              <FixedToolbar>
                <FixedToolbarButtons />
              </FixedToolbar>
            </div>
          </div>

          {/* Content section */}
          <div className="flex-1 overflow-auto">
            <Editor />
          </div>
        </div>
      </Plate>
    </DndProvider>
  );
}

