'use client';

import React from 'react';
import { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import { useEditorRef } from '@udecode/plate-common/react';
import { setFontSize } from '@udecode/plate-font/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToolbarButton } from './toolbar';

const fontSizes = {
  'Small': '0.875em',
  'Normal': '1em',
  'Medium': '1.125em',
  'Large': '1.25em',
  'Extra Large': '1.5em',
  'Huge': '2em'
};

export function FontSizeDropdownMenu(props: DropdownMenuProps) {
  const editor = useEditorRef();

  return (
    <DropdownMenu modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip="Text size" className="min-w-[3rem]">
          <span className="max-w-48 truncate">Size</span>
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        <DropdownMenuRadioGroup className="flex flex-col gap-0.5">
          {Object.entries(fontSizes).map(([name, size]) => (
            <DropdownMenuRadioItem
              key={size}
              value={size}
              className="flex items-center"
              onSelect={(e) => {
                e.preventDefault();
                setFontSize(editor, size);
              }}
            >
              <span style={{ fontSize: size }}>{name}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 