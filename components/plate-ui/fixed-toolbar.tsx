'use client';

import { withCn } from '@udecode/cn';

import { Toolbar } from './toolbar';

export const FixedToolbar = withCn(
  Toolbar,
  'supports-backdrop-blur:bg-background/60 fixed left-0 top-0 z-50 w-full justify-between overflow-x-auto border-b border-b-border bg-background/95 p-1 backdrop-blur scrollbar-hide'
);
