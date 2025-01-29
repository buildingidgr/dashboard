'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';

import { Plate } from '@udecode/plate-common/react';
import { type Value, type TElement, type TDescendant } from '@udecode/plate-common';
import { ParagraphPlugin } from '@udecode/plate-common/react';
import { useEditorScrollRef } from '@udecode/plate-common/react';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Editor } from '@/components/plate-ui/editor';
import { FixedToolbar } from '@/components/plate-ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/plate-ui/fixed-toolbar-buttons';
import { DocumentsService } from '@/lib/services/documents';
import { DocumentWebSocket } from '@/lib/services/websocket';
import { getAccessToken } from '@/lib/services/auth';
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentMetadata } from '@/components/document-metadata';
import { TableOfContents } from '@/components/editor/table-of-contents';
import { EditorContainer } from '@/components/plate-ui/editor';

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
  if (!Array.isArray(content)) {
    console.debug('Content is not an array:', content);
    return false;
  }

  return content.every(node => {
    // Basic node validation
    if (!node || typeof node !== 'object') {
      console.debug('Node is not an object:', node);
      return false;
    }

    // Type validation - accept any string type
    if (!('type' in node) || typeof node.type !== 'string') {
      console.debug('Node has invalid type:', node);
      return false;
    }

    // Children validation - ensure it's an array
    if (!('children' in node)) {
      console.debug('Node has no children:', node);
      return false;
    }

    const children = node.children;
    if (!Array.isArray(children)) {
      console.debug('Node children is not an array:', children);
      return false;
    }

    // Validate each child
    return children.every((child: unknown) => {
      if (!child || typeof child !== 'object') {
        console.debug('Child is not an object:', child);
        return false;
      }

      // Text nodes - accept any string text
      if ('text' in child) {
        const text = (child as { text: unknown }).text;
        if (typeof text !== 'string') {
          console.debug('Text node has invalid text:', text);
          return false;
        }
        return true;
      }

      // Element nodes (recursive validation)
      return validateContent([child as TElement]);
    });
  });
}

// Create a new component for the editor content
interface EditorContentProps {
  title: string;
  setTitle: (title: string) => void;
}

function EditorContent({ title, setTitle }: EditorContentProps) {
  const scrollRef = useEditorScrollRef();

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col" ref={scrollRef}>
      {/* Sticky header section */}
      <div className="sticky top-16 z-30 w-full bg-background">
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

      {/* Content section with TOC sidebar */}
      <div className="flex flex-1">
        <div className="relative flex-1">
          <EditorContainer>
            <div className="mx-auto max-w-[900px]">
              <Editor variant="fullWidth" />
            </div>
          </EditorContainer>
        </div>
        <div className="w-32 flex-none relative">
          <div className="fixed right-4 top-[300px] w-12">
            <TableOfContents />
          </div>
        </div>
      </div>
    </div>
  );
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
            // Log the content structure
            console.debug('Received document content:', JSON.stringify(doc.content.content, null, 2));

            // Validate content structure
            const content = doc.content.content;
            if (!validateContent(content)) {
              throw new Error('Invalid document content structure');
            }

            // Reset editor content and insert new content
            editor.select({ anchor: { path: [0, 0], offset: 0 }, focus: { path: [editor.children.length - 1, 0], offset: 0 } });
            editor.delete();
            editor.insertFragment(content);
            
            // Initialize the last content state
            lastContentRef.current.lastSavedContent = safeStringify(content);
          } catch (error) {
            console.error('Failed to process document content:', error);
            toast.error('Failed to load document content properly.');
            
            // Set default content as fallback
            const defaultContent: TElement[] = [
              {
                type: 'h1',
                children: [{ text: '' }]
              },
              {
                type: ParagraphPlugin.key,
                children: [{ text: '' }]
              }
            ];
            editor.select({ anchor: { path: [0, 0], offset: 0 }, focus: { path: [editor.children.length - 1, 0], offset: 0 } });
            editor.delete();
            editor.insertFragment(defaultContent);
          }
        } else {
          // Set default content
          const defaultContent: TElement[] = [
            {
              type: 'h1',
              children: [{ text: '' }]
            },
            {
              type: ParagraphPlugin.key,
              children: [{ text: '' }]
            }
          ];
          editor.select({ anchor: { path: [0, 0], offset: 0 }, focus: { path: [editor.children.length - 1, 0], offset: 0 } });
          editor.delete();
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

    // Save every 30 seconds (like Notion) instead of 2 seconds
    const interval = setInterval(saveDocument, 30000);

    // Save when user leaves the page
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      e.preventDefault();
      await saveDocument();
      return undefined;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [documentId, editor]);

  // Initialize WebSocket connection
  React.useEffect(() => {
    let isInitializing = false;
    let websocket: DocumentWebSocket | null = null;

    const initializeWebSocket = async () => {
      // Check if WebSocket is enabled via environment variable
      const isWebSocketEnabled = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true';
      if (!isWebSocketEnabled) {
        console.log('WebSocket connections are disabled via environment variable');
        return;
      }

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
                // Set editor content using proper transformation
                const content = data.content.content;
                if (!validateContent(content)) {
                  throw new Error('Invalid document content structure');
                }

                // Reset editor content and insert new content
                editor.select({ anchor: { path: [0, 0], offset: 0 }, focus: { path: [editor.children.length - 1, 0], offset: 0 } });
                editor.delete();
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
        <EditorContent title={title} setTitle={setTitle} />
      </Plate>
    </DndProvider>
  );
}

