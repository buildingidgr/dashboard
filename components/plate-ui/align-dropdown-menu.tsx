'use client';

import React from 'react';
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
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
} from '@/components/ui/dropdown-menu';
import { useOpenState } from '@/hooks/use-open-state';
import { ToolbarButton } from './toolbar';
import { useEditorRef } from '@udecode/plate-common/react';
import { 
  useAlignDropdownMenu,
  useAlignDropdownMenuState 
} from '@udecode/plate-alignment/react';

const alignments = [
  {
    value: 'left',
    icon: AlignLeftIcon,
  },
  {
    value: 'center',
    icon: AlignCenterIcon,
  },
  {
    value: 'right',
    icon: AlignRightIcon,
  },
  {
    value: 'justify',
    icon: AlignJustifyIcon,
  },
] as const;

type Alignment = (typeof alignments)[number]['value'];

export function AlignDropdownMenu(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const { isOpen, toggle } = useOpenState();
  
  const state = useAlignDropdownMenuState();
  const { radioGroupProps } = useAlignDropdownMenu(state);

  const IconComponent = alignments.find((item) => item.value === state.value)?.icon || AlignLeftIcon;

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={toggle} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={isOpen} tooltip="Align">
          <IconComponent />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-0">
        <DropdownMenuRadioGroup 
          {...radioGroupProps}
          className="flex flex-col gap-0.5"
        >
          {alignments.map(({ value, icon: Icon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="min-w-[180px]"
            >
              <Icon className="mr-2 h-4 w-4" />
              <span className="capitalize">{value}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
