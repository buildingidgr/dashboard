'use client';

import { useEffect, useMemo } from 'react';

import { AIChatPlugin, AIPlugin } from '@udecode/plate-ai/react';
import {
  type SlateEditor,
  getAncestorNode,
  getEndPoint,
  getNodeString,
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
  PenLine,
  Wand,
  X,
} from 'lucide-react';
import { Path } from 'slate';

import { CommandGroup, CommandItem } from './command';

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
      console.log('Accept action triggered');
      console.log('Editor state before accept:', editor.children);
      console.log('AI Editor state:', aiEditor.children);
      
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

      // Get the AI content
      const aiContent = aiEditor.children[0];
      if (!aiContent) {
        console.error('No AI content found');
        return;
      }

      const aiText = getNodeString(aiContent);

      try {
        // Select the entire block
        editor.select(blockPath);
        
        // Remove any marks and replace the content
        editor.removeMark('strikethrough');
        editor.deleteFragment();
        editor.insertText(aiText);

        // Clean up the stored block ID
        delete (editor as any).blockToReplace;

        // Hide the AI chat interface
        editor.getApi(AIChatPlugin).aiChat.hide();
        
        // Focus the editor at the end of the inserted content
        focusEditor(editor, getEndPoint(editor, editor.selection!));
        
        console.log('Editor state after accept:', editor.children);
      } catch (error) {
        console.error('Error accepting AI content:', error);
      }
    },
  },
  continueWrite: {
    icon: <PenLine />,
    label: 'Continue writing',
    value: 'continueWrite',
    onSelect: ({ editor }: { editor: PlateEditor; aiEditor: SlateEditor }) => {
      const ancestorNode = getAncestorNode(editor);

      if (!ancestorNode) return;

      const isEmpty = getNodeString(ancestorNode[0]).trim().length === 0;

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: isEmpty
          ? `<Document>
{editor}
</Document>
Start writing a new paragraph AFTER <Document> ONLY ONE SENTENCE`
          : 'Continue writing AFTER <Block> ONLY ONE SENTENCE. DONT REPEAT THE TEXT.',
      });
    },
  },
  discard: {
    icon: <X />,
    label: 'Discard',
    shortcut: 'Esc',
    value: 'discard',
    onSelect: ({ editor }) => {
      // Get the block ID we stored earlier
      const blockId = (editor as any).blockToReplace;
      if (!blockId) {
        console.error('No block ID found for discard');
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

      // Select the block and remove strikethrough
      editor.select(blockPath);
      editor.removeMark('strikethrough');

      // Clean up the stored block ID
      delete (editor as any).blockToReplace;

      // Remove any AI-generated content and hide the interface
      editor.getTransforms(AIPlugin).ai.undo();
      editor.getApi(AIChatPlugin).aiChat.hide();
    },
  },
  explain: {
    icon: <BadgeHelp />,
    label: 'Explain',
    value: 'explain',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: {
          default: 'Explain {editor}',
          selecting: 'Explain',
        },
      });
    },
  },
  fixSpelling: {
    icon: <Check />,
    label: 'Fix spelling & grammar',
    value: 'fixSpelling',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: 'Fix spelling and grammar',
      });
    },
  },
  improveWriting: {
    icon: <Wand />,
    label: 'Improve writing',
    value: 'improveWriting',
    onSelect: ({ editor }) => {
      const selection = editor.selection;
      if (!selection) return;

      // Get the selected text
      const selectedText = editor.string(selection);
      if (!selectedText) return;

      // Get the block containing the selection
      const blockEntry = getAncestorNode(editor);
      if (!blockEntry) return;

      const block = blockEntry[0] as CustomElement;
      const blockId = block.id;
      if (!blockId) return;

      // Apply strikethrough to the selected text
      editor.addMark('strikethrough', true);

      // Store the block ID in the editor state for later use
      (editor as any).blockToReplace = blockId;

      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: 'Improve this text by making it more clear, concise, and professional: ' + selectedText,
      });
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
      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: 'Make longer',
      });
    },
  },
  makeShorter: {
    icon: <ListMinus />,
    label: 'Make shorter',
    value: 'makeShorter',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: 'Make shorter',
      });
    },
  },
  replace: {
    icon: <Check />,
    label: 'Replace selection',
    value: 'replace',
    onSelect: ({ aiEditor, editor }) => {
      // Find the block with strikethrough
      const [strikethroughNode, strikethroughPath] = Array.from(
        editor.nodes({
          match: n => editor.marks?.strikethrough === true,
        })
      )[0] || [];

      if (!strikethroughNode) return;

      // Get the AI content
      const aiContent = aiEditor.children[0];
      if (!aiContent) return;

      const aiText = getNodeString(aiContent);

      // Select the text with strikethrough
      editor.select(strikethroughPath);
      
      // Remove the strikethrough, delete the selected text, and insert new text
      editor.removeMark('strikethrough');
      editor.deleteFragment();
      editor.insertText(aiText);

      // Hide the AI chat interface
      editor.getApi(AIChatPlugin).aiChat.hide();
    },
  },
  simplifyLanguage: {
    icon: <FeatherIcon />,
    label: 'Simplify language',
    value: 'simplifyLanguage',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: 'Simplify the language',
      });
    },
  },
  summarize: {
    icon: <Album />,
    label: 'Add a summary',
    value: 'summarize',
    onSelect: ({ editor }) => {
      void editor.getApi(AIChatPlugin).aiChat.submit({
        mode: 'insert',
        prompt: {
          default: 'Summarize {editor}',
          selecting: 'Summarize',
        },
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
