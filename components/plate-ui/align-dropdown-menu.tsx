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

interface AlignmentItem {
  value: 'left' | 'center' | 'right' | 'justify';
  icon: typeof AlignLeftIcon;
}

const alignItems: AlignmentItem[] = [
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
];

export function AlignDropdownMenu(props: DropdownMenuProps) {
  const { isOpen, toggle } = useOpenState();
  const [value, setValue] = React.useState<AlignmentItem['value']>('left');

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={toggle} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={isOpen} tooltip="Align">
          <AlignLeftIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-0">
        <DropdownMenuRadioGroup 
          value={value} 
          onValueChange={(val) => setValue(val as AlignmentItem['value'])}
          className="flex flex-col gap-0.5"
        >
          {alignItems.map(({ value, icon: Icon }) => (
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
