'use client';

import React from 'react';
import { useEditorRef } from '@udecode/plate-common/react';
import { TextIcon } from 'lucide-react';

import { ToolbarButton } from './toolbar';

const fontSizes = ['1em', '1.25em', '1.5em', '2em'];

export function FontSizeToolbarButton() {
  const editor = useEditorRef();
  const [currentSizeIndex, setCurrentSizeIndex] = React.useState(0);

  const handleClick = () => {
    const nextIndex = (currentSizeIndex + 1) % fontSizes.length;
    setCurrentSizeIndex(nextIndex);
    
    editor.addMark('fontSize', fontSizes[nextIndex]);
  };

  return (
    <ToolbarButton 
      tooltip="Text size" 
      onClick={handleClick}
    >
      <TextIcon className="h-5 w-5" />
      <span className="ml-1">{currentSizeIndex + 1}</span>
    </ToolbarButton>
  );
} 