'use client';

import React, { useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Plate } from '@udecode/plate-common/react';
import { type TElement, type TText, type Value } from '@udecode/plate-common';
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

type EditorValue = Value & { type: string; children: { text: string; }[]; }[];

function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return undefined; // Remove circular reference
      }
      seen.add(value);
    }
    return value;
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
            // Set the editor content directly
            const content = doc.content.content;
            // @ts-ignore - The content structure is compatible with Plate's internal types
            editor.children = content;
            editor.onChange();
            
            // Initialize the last content state
            lastContentRef.current.lastSavedContent = safeStringify(content);
          } catch (error) {
            console.error('Failed to process document content:', error);
            toast.error('Failed to load document content properly.');
            
            // Set default content as fallback
            const defaultContent = [{
              type: ParagraphPlugin.key,
              children: [{ text: '' }]
            }];
            // @ts-ignore - The content structure is compatible with Plate's internal types
            editor.children = defaultContent;
            editor.onChange();
          }
        } else {
          // Set default content
          const defaultContent = [{
            type: ParagraphPlugin.key,
            children: [{ text: '' }]
          }];
          // @ts-ignore - The content structure is compatible with Plate's internal types
          editor.children = defaultContent;
          editor.onChange();
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
  }, [editor]);

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
            content: editor.children
          }
        };
        await DocumentsService.updateDocument(documentId, payload);
      } catch (error) {
        console.error('Failed to save document:', error);
        toast.error('Failed to save document. Please try again.');
      }
    };

    // Save every 5 seconds if there are changes
    const interval = setInterval(saveDocument, 5000);
    return () => clearInterval(interval);
  }, [documentId, editor]);

  // Initialize WebSocket connection
  React.useEffect(() => {
    let websocket: DocumentWebSocket | null = null;
    let isInitializing = false;

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
                // Set the editor content directly
                const content = data.content.content;
                // @ts-ignore - The content structure is compatible with Plate's internal types
                editor.children = content;
                editor.onChange();
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
      isInitializing = false;
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
      <div className="relative w-full h-full px-16 py-16 space-y-4">
        <Skeleton className="h-7 w-[200px] mb-8" />
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[75%]" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[60%]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen">
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
        <Plate
          editor={editor}
          onChange={handleContentChange}
        >
          <Editor />
        </Plate>
      </div>
    </div>
  );
}

