'use client';

import * as React from 'react';
import { AIChatPlugin, useEditorChat } from '@udecode/plate-ai/react';
import {
  type SlateEditor,
  type TElement,
  type TNodeEntry,
  getAncestorNode,
  getBlocks,
  isElementEmpty,
  isHotkey,
  isSelectionAtBlockEnd,
} from '@udecode/plate-common';
import {
  toDOMNode,
  useEditorPlugin,
  useHotkeys,
} from '@udecode/plate-common/react';
import {
  BlockSelectionPlugin,
  useIsSelecting,
} from '@udecode/plate-selection/react';
import { Loader2Icon } from 'lucide-react';

import { useAIChat } from '@/components/editor/plugins/ai-plugins';
import { AIChatEditor } from './ai-chat-editor';
import { AIMenuItems } from './ai-menu-items';
import { Command, CommandList, InputCommand } from './command';
import { Popover, PopoverAnchor, PopoverContent } from './popover';

export function AIMenu() {
  const { api, editor, useOption } = useEditorPlugin(AIChatPlugin);
  const open = useOption('open');
  const mode = useOption('mode');
  const isSelecting = useIsSelecting();

  const aiEditorRef = React.useRef<SlateEditor | null>(null);
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const chat = useAIChat();

  const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);

  const setOpen = (open: boolean) => {
    if (open) {
      api.aiChat.show();
      setError(null);
    } else {
      api.aiChat.hide();
    }
  };

  const show = (anchorElement: HTMLElement) => {
    setAnchorElement(anchorElement);
    setOpen(true);
  };

  useEditorChat({
    chat,
    onOpenBlockSelection: (blocks: TNodeEntry[]) => {
      show(toDOMNode(editor, blocks.at(-1)![0])!);
    },
    onOpenChange: (open) => {
      if (!open) {
        setAnchorElement(null);
        chat.setInput('');
      }
    },
    onOpenCursor: () => {
      const ancestor = getAncestorNode(editor)?.[0] as TElement;

      if (!isSelectionAtBlockEnd(editor) && !isElementEmpty(editor, ancestor)) {
        editor
          .getApi(BlockSelectionPlugin)
          .blockSelection.addSelectedRow(ancestor.id as string);
      }

      show(toDOMNode(editor, ancestor)!);
    },
    onOpenSelection: () => {
      show(toDOMNode(editor, getBlocks(editor).at(-1)![0])!);
    },
  });

  useHotkeys(
    'meta+j',
    () => {
      api.aiChat.show();
    },
    { enableOnContentEditable: true, enableOnFormTags: true }
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor virtualRef={{ current: anchorElement }} />

      <PopoverContent
        className="border-none bg-transparent p-0 shadow-none"
        style={{
          width: anchorElement?.offsetWidth,
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();

          if (chat.isLoading) {
            chat.stop();
          } else {
            api.aiChat.hide();
          }
        }}
        align="center"
        avoidCollisions={false}
        side="bottom"
      >
        <Command
          className="w-full rounded-lg border shadow-md"
          value={value}
          onValueChange={setValue}
        >
          {error && (
            <div className="flex items-center gap-2 p-2 text-sm text-red-500">
              <span className="flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {chat.messages.length > 0 && (
            <div className="ai-chat-preview hidden">
              <AIChatEditor aiEditorRef={aiEditorRef} />
            </div>
          )}

          {chat.isLoading ? (
            <div className="flex grow select-none items-center gap-2 p-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              {chat.messages.length > 1 ? 'Editing...' : 'Thinking...'}
            </div>
          ) : (
            <InputCommand
              variant="ghost"
              className="rounded-none border-b border-solid border-border [&_svg]:hidden"
              value={chat.input}
              onKeyDown={(e) => {
                if (isHotkey('backspace')(e) && chat.input.length === 0) {
                  e.preventDefault();
                  api.aiChat.hide();
                }
                if (isHotkey('enter')(e) && !e.shiftKey && !value) {
                  e.preventDefault();
                  setError(null);
                  void chat.handleSubmit(e);
                }
              }}
              onValueChange={chat.setInput}
              placeholder="Ask AI anything..."
              data-plate-focus
              autoFocus
            />
          )}

          {!chat.isLoading && !error && (
            <CommandList>
              <AIMenuItems aiEditorRef={aiEditorRef} setValue={setValue} />
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
