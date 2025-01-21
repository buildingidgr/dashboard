'use client';

import React from 'react';
import { createEditor, Descendant, Element as SlateElement } from 'slate';
import { withReact, Slate, Editable } from 'slate-react';
import { withHistory } from 'slate-history';

type CustomElement = { type: 'paragraph'; children: { text: string }[] };
type CustomText = { text: string };
declare module 'slate' {
  interface CustomTypes {
    Element: CustomElement;
    Text: CustomText;
  }
}

export interface PlateEditorProps {
  value?: Descendant[];
  onChange?: (value: Descendant[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph' as const,
    children: [{ text: '' }],
  },
];

export function PlateEditor({
  value = initialValue,
  onChange,
  placeholder = 'Type something...',
  readOnly = false,
}: PlateEditorProps) {
  const [editor] = React.useState(() => withHistory(withReact(createEditor())));

  return (
    <div className="min-h-[150px] rounded-md border border-input bg-background px-3 py-2">
      <Slate
        editor={editor}
        initialValue={value}
        onChange={onChange}
      >
        <Editable
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </Slate>
    </div>
  );
} 