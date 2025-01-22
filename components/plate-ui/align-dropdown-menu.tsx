'use client';

import React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import {
  useAlignDropdownMenu,
  useAlignDropdownMenuState,
} from '@udecode/plate-alignment/react';
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  useOpenState,
} from './dropdown-menu';
import { ToolbarButton } from './toolbar';
import { usePlateEditorState } from '@udecode/plate-core';
import { getPluginOptions } from '@udecode/plate-core';
import { ELEMENT_ALIGN } from '@udecode/plate-core';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

const items = [
  {
    icon: AlignLeftIcon,
    value: 'left',
  },
  {
    icon: AlignCenterIcon,
    value: 'center',
  },
  {
    icon: AlignRightIcon,
    value: 'right',
  },
  {
    icon: AlignJustifyIcon,
    value: 'justify',
  },
];

export function AlignDropdownMenu() {
  const editor = usePlateEditorState();
  const value = getPluginOptions(editor, ELEMENT_ALIGN).align.default;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Icons.alignLeft className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Icons.alignLeft className="mr-2 h-4 w-4" />
          <span>Left</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Icons.alignCenter className="mr-2 h-4 w-4" />
          <span>Center</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Icons.alignRight className="mr-2 h-4 w-4" />
          <span>Right</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
