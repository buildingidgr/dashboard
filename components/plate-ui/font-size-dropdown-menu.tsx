'use client';

import React from 'react';
import { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import { useEditorRef } from '@udecode/plate-common/react';

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
  const [fontSize, setFontSize] = React.useState('1em');

  return (
    <DropdownMenu modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton tooltip="Font size">
          <span className="text-base">A</span>
          <span className="text-lg">A</span>
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[180px]">
        <DropdownMenuRadioGroup 
          className="flex flex-col gap-0.5"
          value={fontSize}
          onValueChange={(value) => {
            setFontSize(value);
            editor.addMark('fontSize', value);
          }}
        >
          {Object.entries(fontSizes).map(([name, size]) => (
            <DropdownMenuRadioItem
              key={name}
              value={size}
              className="flex items-center"
            >
              {name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 