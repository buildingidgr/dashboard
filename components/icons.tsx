'use client';

import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Circle,
  Plus,
  X,
  type LucideIcon,
} from 'lucide-react';

export type Icon = LucideIcon;

export const Icons = {
  alignLeft: AlignLeftIcon,
  alignCenter: AlignCenterIcon,
  alignRight: AlignRightIcon,
  alignJustify: AlignJustifyIcon,
  check: Check,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  chevronsUpDown: ChevronsUpDown,
  circle: Circle,
  plus: Plus,
  x: X,
} as const; 