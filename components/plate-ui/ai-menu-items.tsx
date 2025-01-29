'use client';

import { useEffect, useMemo } from 'react';

import { AIChatPlugin, AIPlugin } from '@udecode/plate-ai/react';
import {
  type SlateEditor,
  getAncestorNode,
  getEndPoint,
  getNodeString,
  type TDescendant,
  type TElement,
  type TNode,
  type TOperation,
} from '@udecode/plate-common';
import {
  type PlateEditor,
  focusEditor,
  useEditorPlugin,
} from '@udecode/plate-common/react';
import { useIsSelecting } from '@udecode/plate-selection/react';
import {
  Album,
  BadgeHelp,
  Check,
  CornerUpLeft,
  FeatherIcon,
  ListEnd,
  ListMinus,
  ListPlus,
  MessageSquare,
  PenLine,
  Wand,
  X,
} from 'lucide-react';
import { Path, Node } from 'slate';

import { CommandGroup, CommandItem } from './command';
import { EditorVisualManager } from './editor-visual-utils';

export type EditorChatState =
  | 'cursorCommand'
  | 'cursorSuggestion'
  | 'selectionCommand'
  | 'selectionSuggestion';

// Add type for custom element with ID
type CustomElement = {
  id?: string;
  type: string;
  children: any[];
  isPendingReplacement?: boolean;
};

type MenuItemType = {
  icon: React.ReactNode;
  label: string;
  value: string;
  shortcut?: string;
  component?: React.ComponentType<{ menuState: EditorChatState }>;
  filterItems?: boolean;
  items?: { label: string; value: string }[];
  onSelect?: (props: { editor: PlateEditor; aiEditor: SlateEditor }) => void;
};

export const aiChatItems: Record<string, MenuItemType> = {
  accept: {
    icon: <Check />,
    label: 'Accept',
    value: 'accept',
    onSelect: ({ editor, aiEditor }) => {
      console.log('=== Accept Action Started ===');
      console.log('Editor state before accept:', editor.children);
      console.log('AI Editor state:', aiEditor.children);
      
      // Get the block ID (for replacement cases)
      const blockId = (editor as any).blockToReplace;
      // Get the insertion position (for insertion cases)
      const insertPosition = (editor as any).insertPosition;
      // Get selected block IDs (for multiple block selection)
      const selectedBlockIds = (editor as any).selectedBlockIds || [];

      try {
        // Get the AI content
        const aiContent = aiEditor.children[0];
        if (!aiContent) {
          console.error('No AI content found');
          return;
        }

        const aiText = getNodeString(aiContent);
        console.log('AI text to insert:', aiText);

        if (selectedBlockIds.length > 0) {
          // Handle multiple block selection case
          const blockEntries = Array.from(
            editor.nodes({
              match: n => !('text' in n) && selectedBlockIds.includes((n as CustomElement).id),
            })
          );

          if (blockEntries.length === 0) {
            console.error('No blocks found with selected IDs:', selectedBlockIds);
            return;
          }

          // Sort blocks by path to ensure we replace from bottom to top
          blockEntries.sort((a, b) => Path.compare(b[1], a[1]));

          // Replace each selected block with the AI content
          blockEntries.forEach(([node, path]) => {
            editor.apply({
              type: 'remove_node',
              path,
              node: node as TDescendant,
            } as TOperation);
          });

          // Insert the AI content at the position of the first block
          const firstPath = blockEntries[blockEntries.length - 1][1];
          const nodes = Array.isArray(aiContent) ? aiContent : [aiContent];
          editor.insertNodes(nodes as Node[], { at: firstPath });
        } else if (blockId) {
          // Handle single block replacement case
          const [blockNode, blockPath] = Array.from(
            editor.nodes({
              match: n => !('text' in n) && (n as CustomElement).id === blockId,
            })
          )[0] || [];

          if (!blockNode) {
            console.error('No block found with ID:', blockId);
            return;
          }

          // Remove visual feedback
          EditorVisualManager.removeVisualFeedback({
            blockId,
            styles: {
              opacity: '0.5',
              textDecoration: 'line-through'
            },
            debug: true
          });

          // Replace the content
          editor.select(blockPath);
          editor.deleteFragment();
          editor.insertText(aiText);

          // Clean up the stored block ID
          delete (editor as any).blockToReplace;
        } else if (insertPosition) {
          // Handle insertion case (continue writing, summarize, explain, ask AI)
          editor.select(insertPosition);

          // Split AI text into paragraphs and preserve formatting
          const paragraphs = aiText.split('\n').filter(p => p.trim());

          // Create new paragraph nodes for each line
          paragraphs.forEach((text, index) => {
            // Create a unique ID for the new paragraph
            const newId = `ai-${Date.now()}-${index}`;

            // Create a new paragraph node with text
            const newParagraph = {
              type: 'p',
              id: newId,
              children: [{ text: text.trim() }]
            };

            // Insert the new paragraph
            editor.insertNode(newParagraph);

            // Move selection to the end of the inserted paragraph
            const point = editor.end([]);
            editor.select(point);

            // Add a line break after each paragraph except the last one
            if (index < paragraphs.length - 1) {
              editor.insertBreak();
            }
          });

          // Clean up the stored insertion position
          delete (editor as any).insertPosition;
        } else {
          console.error('No block ID or insertion position found');
          return;
        }

        // Hide the AI chat interface
        editor.getApi(AIChatPlugin).aiChat.hide();
        
        // Focus the editor at the end of the inserted content
        focusEditor(editor, getEndPoint(editor, editor.selection!));
        
        console.log('Editor state after accept:', editor.children);
        console.log('=== Accept Action Completed ===');
      } catch (error) {
        console.error('Error accepting AI content:', error);
      }
    },
  },
  continueWrite: {
    icon: <PenLine />,
    label: 'Continue writing',
    value: 'continueWrite',
    onSelect: ({ editor }) => {
      // Get the entire document content
      const documentContent = editor.children.map(getNodeString).join('\n');

      // Store the current selection for later use
      (editor as any).insertPosition = editor.selection;

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: `<Document>\n${documentContent}\n</Document>\nStart writing a new paragraph AFTER <Document> ONLY ONE SENTENCE`,
      });
    },
  },
  discard: {
    icon: <X />,
    label: 'Discard',
    shortcut: 'Esc',
    value: 'discard',
    onSelect: ({ editor }) => {
      console.log('=== Discard Action Started ===');
      
      // Get the block ID (for replacement cases)
      const blockId = (editor as any).blockToReplace;
      // Get the insertion position (for insertion cases)
      const insertPosition = (editor as any).insertPosition;

      try {
        if (blockId) {
          // Handle replacement case
          EditorVisualManager.removeVisualFeedback({
            blockId,
            styles: {
              opacity: '0.5',
              textDecoration: 'line-through'
            },
            debug: true
          });

          // Clean up the stored block ID
          delete (editor as any).blockToReplace;
        } else if (insertPosition) {
          // Handle insertion case
          // Just clean up the stored insertion position
          delete (editor as any).insertPosition;
        }

        // Remove any AI-generated content
        editor.getTransforms(AIPlugin).ai.undo();
        console.log('Removed AI-generated content');

        // Hide the AI chat interface
        editor.getApi(AIChatPlugin).aiChat.hide();
        console.log('=== Discard Action Completed ===');
      } catch (error) {
        console.error('Error during discard:', error);
      }
    },
  },
  explain: {
    icon: <BadgeHelp />,
    label: 'Explain',
    value: 'explain',
    onSelect: ({ editor }) => {
      // Get the entire document content
      const documentContent = editor.children.map(getNodeString).join('\n');

      // Store the current selection for later use
      (editor as any).insertPosition = editor.selection;

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: `<Document>\n${documentContent}\n</Document>\nExplain the content of <Document>`,
      });
    },
  },
  fixSpelling: {
    icon: <Check />,
    label: 'Fix spelling & grammar',
    value: 'fixSpelling',
    onSelect: ({ editor }) => {
      const selection = editor.selection;
      if (!selection) {
        console.log('No selection found');
        return;
      }

      // Get the selected text
      const selectedText = editor.string(selection);
      if (!selectedText) {
        console.log('No selected text found');
        return;
      }

      // Get the block containing the selection
      const blockEntry = getAncestorNode(editor);
      if (!blockEntry) {
        console.log('No block entry found');
        return;
      }

      const block = blockEntry[0] as CustomElement;
      const blockId = block.id;
      if (!blockId) {
        console.log('Block has no ID');
        return;
      }

      // Store the block ID in the editor state for later use
      (editor as any).blockToReplace = blockId;

      // Apply visual feedback
      EditorVisualManager.applyVisualFeedback({
        blockId,
        styles: {
          opacity: '0.5',
          textDecoration: 'line-through'
        },
        debug: true
      });

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: 'Fix the spelling and grammar of this text: ' + selectedText,
      });
    },
  },
  improveWriting: {
    icon: <Wand />,
    label: 'Improve writing',
    value: 'improveWriting',
    onSelect: ({ editor }) => {
      console.log('=== Improve Writing Started ===');
      
      const selection = editor.selection;
      if (!selection) {
        console.log('No selection found');
        return;
      }

      // Get the selected text
      const selectedText = editor.string(selection);
      if (!selectedText) {
        console.log('No selected text found');
        return;
      }

      // Get all blocks in the selection range
      const selectedBlocks = Array.from(
        editor.nodes({
          at: selection,
          match: n => !('text' in n) && (n as CustomElement).id !== undefined,
        })
      );

      if (selectedBlocks.length === 0) {
        console.log('No blocks found in selection');
        return;
      }

      // Store the block IDs in the editor state for later use
      const selectedBlockIds = selectedBlocks.map(([block]) => (block as CustomElement).id!) as string[];
      (editor as any).selectedBlockIds = selectedBlockIds;

      // Apply visual feedback to all selected blocks
      selectedBlockIds.forEach(blockId => {
        EditorVisualManager.applyVisualFeedback({
          blockId,
          styles: {
            opacity: '0.5',
            textDecoration: 'line-through'
          },
          debug: true
        });
      });

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: 'Improve this text by making it more clear, concise, and professional: ' + selectedText,
      });
      console.log('=== Improve Writing Completed ===');
    },
  },
  insertBelow: {
    icon: <ListEnd />,
    label: 'Insert below',
    value: 'insertBelow',
    onSelect: ({ aiEditor, editor }) => {
      void editor.getTransforms(AIChatPlugin).aiChat.insertBelow(aiEditor);
    },
  },
  makeLonger: {
    icon: <ListPlus />,
    label: 'Make longer',
    value: 'makeLonger',
    onSelect: ({ editor }) => {
      const selection = editor.selection;
      if (!selection) {
        console.log('No selection found');
        return;
      }

      // Get the selected text
      const selectedText = editor.string(selection);
      if (!selectedText) {
        console.log('No selected text found');
        return;
      }

      // Get the block containing the selection
      const blockEntry = getAncestorNode(editor);
      if (!blockEntry) {
        console.log('No block entry found');
        return;
      }

      const block = blockEntry[0] as CustomElement;
      const blockId = block.id;
      if (!blockId) {
        console.log('Block has no ID');
        return;
      }

      // Store the block ID in the editor state for later use
      (editor as any).blockToReplace = blockId;

      // Apply visual feedback
      EditorVisualManager.applyVisualFeedback({
        blockId,
        styles: {
          opacity: '0.5',
          textDecoration: 'line-through'
        },
        debug: true
      });

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: 'Make this text longer: ' + selectedText,
      });
    },
  },
  makeShorter: {
    icon: <ListMinus />,
    label: 'Make shorter',
    value: 'makeShorter',
    onSelect: ({ editor }) => {
      const selection = editor.selection;
      if (!selection) {
        console.log('No selection found');
        return;
      }

      // Get the selected text
      const selectedText = editor.string(selection);
      if (!selectedText) {
        console.log('No selected text found');
        return;
      }

      // Get the block containing the selection
      const blockEntry = getAncestorNode(editor);
      if (!blockEntry) {
        console.log('No block entry found');
        return;
      }

      const block = blockEntry[0] as CustomElement;
      const blockId = block.id;
      if (!blockId) {
        console.log('Block has no ID');
        return;
      }

      // Store the block ID in the editor state for later use
      (editor as any).blockToReplace = blockId;

      // Apply visual feedback
      EditorVisualManager.applyVisualFeedback({
        blockId,
        styles: {
          opacity: '0.5',
          textDecoration: 'line-through'
        },
        debug: true
      });

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: 'Make this text shorter: ' + selectedText,
      });
    },
  },
  replace: {
    icon: <Check />,
    label: 'Replace selection',
    value: 'replace',
    onSelect: ({ aiEditor, editor }) => {
      // Get the block ID we stored earlier
      const blockId = (editor as any).blockToReplace;
      if (!blockId) {
        console.error('No block ID found');
        return;
      }

      // Find the block by ID
      const [blockNode, blockPath] = Array.from(
        editor.nodes({
          match: n => !('text' in n) && (n as CustomElement).id === blockId,
        })
      )[0] || [];

      if (!blockNode) {
        console.error('No block found with ID:', blockId);
        return;
      }

      // Find the block element and clean up temporary classes
      const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
      if (blockElement) {
        console.log('Block element found for cleanup, current classes:', blockElement.classList.toString());
        
        // Remove classes from all text spans
        const textSpans = blockElement.querySelectorAll('[data-slate-string="true"]');
        textSpans.forEach(span => {
          console.log('Removing classes from span:', span.textContent);
          span.classList.remove('opacity-50', 'line-through');
        });
        
        console.log('Classes after cleanup:', 
          Array.from(textSpans).map(span => span.classList.toString())
        );
      }

      // Get the AI content
      const aiContent = aiEditor.children[0];
      if (!aiContent) {
        console.error('No AI content found');
        return;
      }

      const aiText = getNodeString(aiContent);

      try {
        // Select the block and replace content
        editor.select(blockPath);
        editor.deleteFragment();
        editor.insertText(aiText);

        // Clean up the stored block ID
        delete (editor as any).blockToReplace;

        // Hide the AI chat interface
        editor.getApi(AIChatPlugin).aiChat.hide();
        
        // Focus the editor at the end of the inserted content
        focusEditor(editor, getEndPoint(editor, editor.selection!));
      } catch (error) {
        console.error('Error replacing content:', error);
      }
    },
  },
  simplifyLanguage: {
    icon: <FeatherIcon />,
    label: 'Simplify language',
    value: 'simplifyLanguage',
    onSelect: ({ editor }) => {
      const selection = editor.selection;
      if (!selection) {
        console.log('No selection found');
        return;
      }

      // Get the selected text
      const selectedText = editor.string(selection);
      if (!selectedText) {
        console.log('No selected text found');
        return;
      }

      // Get the block containing the selection
      const blockEntry = getAncestorNode(editor);
      if (!blockEntry) {
        console.log('No block entry found');
        return;
      }

      const block = blockEntry[0] as CustomElement;
      const blockId = block.id;
      if (!blockId) {
        console.log('Block has no ID');
        return;
      }

      // Store the block ID in the editor state for later use
      (editor as any).blockToReplace = blockId;

      // Apply visual feedback
      EditorVisualManager.applyVisualFeedback({
        blockId,
        styles: {
          opacity: '0.5',
          textDecoration: 'line-through'
        },
        debug: true
      });

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: 'Simplify the language of this text: ' + selectedText,
      });
    },
  },
  summarize: {
    icon: <Album />,
    label: 'Add a summary',
    value: 'summarize',
    onSelect: ({ editor }) => {
      // Get the entire document content
      const documentContent = editor.children.map(getNodeString).join('\n');

      // Store the current selection for later use
      (editor as any).insertPosition = editor.selection;

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: `<Document>\n${documentContent}\n</Document>\nSummarize the content of <Document>`,
      });
    },
  },
  tryAgain: {
    icon: <CornerUpLeft />,
    label: 'Try again',
    value: 'tryAgain',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.reload();
    },
  },
  askAI: {
    icon: <MessageSquare />,
    label: 'Ask AI anything',
    value: 'askAI',
    onSelect: ({ editor }) => {
      // Get the entire document content
      const documentContent = editor.children.map(getNodeString).join('\n');

      // Store the current selection for later use
      (editor as any).insertPosition = editor.selection;

      // Create a new paragraph for the response
      const newId = `ai-${Date.now()}`;
      const newParagraph = {
        type: 'p',
        id: newId,
        children: [{ text: '' }]
      };

      // Insert the new paragraph at the current position
      editor.insertNode(newParagraph);

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: `<Document>\n${documentContent}\n</Document>\nAnalyze the content in <Document> and provide insights. Write your response as a clear, concise paragraph.`,
      });
    },
  },
} satisfies Record<string, MenuItemType>;

const menuStateItems: Record<
  EditorChatState,
  {
    items: (typeof aiChatItems)[keyof typeof aiChatItems][];
    heading?: string;
  }[]
> = {
  cursorCommand: [
    {
      items: [
        aiChatItems.continueWrite,
        aiChatItems.summarize,
        aiChatItems.explain,
      ],
    },
  ],
  cursorSuggestion: [
    {
      items: [aiChatItems.accept, aiChatItems.discard, aiChatItems.tryAgain],
    },
  ],
  selectionCommand: [
    {
      items: [
        aiChatItems.improveWriting,
        aiChatItems.makeLonger,
        aiChatItems.makeShorter,
        aiChatItems.fixSpelling,
        aiChatItems.simplifyLanguage,
      ],
    },
  ],
  selectionSuggestion: [
    {
      items: [
        aiChatItems.replace,
        aiChatItems.insertBelow,
        aiChatItems.discard,
        aiChatItems.tryAgain,
      ],
    },
  ],
};

export const AIMenuItems = ({
  aiEditorRef,
  setValue,
}: {
  aiEditorRef: React.MutableRefObject<SlateEditor | null>;
  setValue: (value: string) => void;
}) => {
  const { editor, useOption } = useEditorPlugin(AIChatPlugin);
  const { messages } = useOption('chat');
  const isSelecting = useIsSelecting();

  const menuState = useMemo(() => {
    if (messages && messages.length > 0) {
      return isSelecting ? 'selectionSuggestion' : 'cursorSuggestion';
    }

    return isSelecting ? 'selectionCommand' : 'cursorCommand';
  }, [isSelecting, messages]);

  const menuGroups = useMemo(() => {
    const items = menuStateItems[menuState];

    return items;
  }, [menuState]);

  useEffect(() => {
    if (menuGroups.length > 0 && menuGroups[0].items.length > 0) {
      setValue(menuGroups[0].items[0].value);
    }
  }, [menuGroups, setValue]);

  return (
    <>
      {menuGroups.map((group, index) => (
        <CommandGroup key={index} heading={group.heading}>
          {group.items.map((menuItem) => (
            <CommandItem
              key={menuItem.value}
              className="cursor-pointer [&_svg]:text-muted-foreground"
              value={menuItem.value}
              onSelect={() => {
                menuItem.onSelect?.({
                  aiEditor: aiEditorRef.current!,
                  editor: editor,
                });
              }}
            >
              {menuItem.icon}
              <span>{menuItem.label}</span>
              {menuItem.shortcut && (
                <span className="ml-auto text-xs tracking-widest text-muted-foreground">
                  {menuItem.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      ))}
    </>
  );
};
