'use client';

import React, { useCallback } from 'react';
import { withRef } from '@udecode/cn';
import { useEditorRef } from '@udecode/plate-common/react';
import { toggleMark } from '@udecode/plate-common';

import { ToolbarButton } from './toolbar';

export const MarkToolbarButton = withRef<
  typeof ToolbarButton,
  {
    nodeType: string;
    clear?: string[] | string;
  }
>(({ clear, nodeType, ...rest }, ref) => {
  const editor = useEditorRef();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
    },
    []
  );

  const handleClick = useCallback(() => {
    if (!editor) return;
    toggleMark(editor, { key: nodeType, clear });
  }, [editor, nodeType, clear]);

  return (
    <ToolbarButton 
      ref={ref}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      {...rest}
    />
  );
});
