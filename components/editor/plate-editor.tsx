'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Plate } from '@udecode/plate-common/react';
import { type TElement, type Value, type TText, type TDescendant } from '@udecode/plate-common';
import { ParagraphPlugin } from '@udecode/plate-common/react';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Editor, EditorContainer } from '@/components/plate-ui/editor';
import { FixedToolbar } from '@/components/plate-ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/plate-ui/fixed-toolbar-buttons';
import { DocumentsService } from '@/lib/services/documents';
import { DocumentWebSocket } from '@/lib/services/websocket';
import { getAccessToken } from '@/lib/services/auth';
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentMetadata } from '@/components/document-metadata';

interface RichText extends TText {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  subscript?: boolean;
  superscript?: boolean;
}

interface ParagraphElement extends TElement {
  type: typeof ParagraphPlugin.key;
  children: RichText[];
}

type DocumentValue = ParagraphElement[];

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

function normalizeContent(content: TElement[]): DocumentValue {
  // Create a clean version of the content without circular references
  return content.map(block => {
    const cleanBlock: ParagraphElement = {
      type: ParagraphPlugin.key,
      children: Array.isArray(block.children) 
        ? block.children.map(child => {
            if (typeof child === 'object' && child !== null) {
              // Only keep essential text properties
              const cleanChild: RichText = {
                text: (child as any).text || '',
                bold: (child as any).bold,
                italic: (child as any).italic,
                underline: (child as any).underline,
                strikethrough: (child as any).strikethrough,
                code: (child as any).code,
                subscript: (child as any).subscript,
                superscript: (child as any).superscript
              };
              // Remove undefined properties
              Object.keys(cleanChild).forEach(key => 
                cleanChild[key] === undefined && delete cleanChild[key]
              );
              return cleanChild;
            }
            return { text: String(child) };
          })
        : [{ text: '' }]
    };
    return cleanBlock;
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
            // Clean and normalize the loaded content
            const cleanContent = doc.content.content.map(block => {
              const type = block.type || ParagraphPlugin.key;
              const textNodes = Array.isArray(block.children) 
                ? block.children.map(child => {
                    if (typeof child === 'object' && child !== null) {
                      // Keep all styling properties
                      const textNode: RichText = {
                        text: (child as any).text || '',
                        bold: (child as any).bold,
                        italic: (child as any).italic,
                        underline: (child as any).underline,
                        strikethrough: (child as any).strikethrough,
                        code: (child as any).code,
                        subscript: (child as any).subscript,
                        superscript: (child as any).superscript
                      };
                      // Remove undefined properties
                      Object.keys(textNode).forEach(key => 
                        textNode[key] === undefined && delete textNode[key]
                      );
                      return textNode;
                    }
                    return { text: String(child) };
                  })
                : [{ text: '' }];

              return {
                type: ParagraphPlugin.key,
                children: textNodes
              } as ParagraphElement;
            });

            // Initialize the last content state with cleaned content
            lastContentRef.current.lastSavedContent = safeStringify(cleanContent);
            
            // Set the editor content
            editor.children = cleanContent;
            editor.onChange();
          } catch (error) {
            console.error('Failed to process document content:', error);
            toast.error('Failed to load document content properly.');
            
            // Set default content as fallback
            editor.children = [{
              type: ParagraphPlugin.key,
              children: [{ text: '' }]
            }] as DocumentValue;
            editor.onChange();
          }
        } else {
          // Set default content
          editor.children = [{
            type: ParagraphPlugin.key,
            children: [{ text: '' }]
          }] as DocumentValue;
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
      // Skip if editor is empty or has no content
      if (!editor.children || editor.children.length === 0) {
        console.log('Editor is empty, skipping save');
        return;
      }

      // Normalize the content by removing unstable properties and cleaning up the structure
      const normalizedContent = normalizeContent(editor.children);

      // Check if content is just empty paragraphs
      const isOnlyEmptyParagraphs = normalizedContent.every((block: any) => 
        (block.type === 'p' || block.type === 'paragraph') && 
        (!block.children || block.children.length === 0 || 
         (block.children.length === 1 && (!block.children[0].text || block.children[0].text.trim() === '')))
      );

      if (isOnlyEmptyParagraphs) {
        console.log('Content contains only empty paragraphs, skipping save');
        return;
      }

      // Store the last saved content string on first run
      if (!lastContentRef.current.lastSavedContent) {
        lastContentRef.current.lastSavedContent = safeStringify(normalizedContent);
        return;
      }

      // Compare with last saved content
      const currentContentString = safeStringify(normalizedContent);
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
            content: normalizedContent
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
                const mappedContent = data.content.content.map(node => ({
                  ...node,
                  type: node.type || 'p',
                  children: Array.isArray(node.children) 
                    ? node.children.map(child => {
                        if (typeof child === 'object' && child !== null) {
                          return {
                            ...child,
                            text: (child as any).text || ''
                          } as RichText;
                        }
                        return { text: String(child) };
                      })
                    : [{ text: '' }]
                })) as DocumentValue;
                console.log('Setting editor content:', mappedContent);
                editor.children = mappedContent;
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
    <DndProvider backend={HTML5Backend}>
      <Plate
        editor={editor}
        onChange={handleContentChange}
      >
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
            <EditorContainer>
              <Editor />
            </EditorContainer>
          </div>
        </div>
      </Plate>
    </DndProvider>
  );
}

