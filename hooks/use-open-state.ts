import { useState, useCallback } from 'react';

export function useOpenState(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((state) => !state), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  } as const;
} 