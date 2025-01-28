'use client';

import { cn, withRef } from '@udecode/cn';
import {
  useTocElement,
  useTocElementState,
} from '@udecode/plate-heading/react';
import { cva } from 'class-variance-authority';

import { Button } from './button';
import { PlateElement } from './plate-element';

const headingItemVariants = cva(
  'block h-auto w-full cursor-pointer truncate rounded-none px-0.5 py-1.5 text-left font-medium text-muted-foreground underline decoration-[0.5px] underline-offset-4 hover:bg-accent hover:text-muted-foreground',
  {
    variants: {
      depth: {
        1: 'pl-0.5',
        2: 'pl-[26px]',
        3: 'pl-[50px]',
      },
    },
  }
);

export const TocElement = withRef<typeof PlateElement>(
  ({ children, className, ...props }, ref) => {
    const state = useTocElementState();
    const { props: btnProps } = useTocElement(state);

    const { headingList } = state;

    console.log('TocElement state:', {
      headingList,
      btnProps
    });

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>, item: any) => {
      console.log('Clicked heading:', item);
      const headingElement = document.querySelector(`[data-slate-node="element"][data-slate-type="${item.type}"]`);
      console.log('Found heading element:', headingElement);
      
      if (headingElement) {
        e.preventDefault();

        // Calculate offsets for sticky elements
        const navbarHeight = 64; // Height of the top navbar
        const toolbarHeight = 56; // Height of the editor toolbar
        const documentMetadataHeight = 64; // Height of the document metadata section
        const totalOffset = navbarHeight + toolbarHeight + documentMetadataHeight;

        // Get the element's position
        const elementRect = headingElement.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        
        // Calculate the final scroll position
        const scrollPosition = absoluteElementTop - totalOffset;

        // Smooth scroll to the position
        window.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
      
      btnProps.onClick(e, item, 'smooth');
    };

    return (
      <PlateElement
        ref={ref}
        className={cn(className, 'relative mb-1 p-0')}
        {...props}
      >
        <div contentEditable={false}>
          {headingList.length > 0 ? (
            headingList.map((item) => {
              console.log('Rendering heading item:', item);
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    headingItemVariants({ depth: item.depth as any })
                  )}
                  onClick={(e) => handleClick(e, item)}
                  aria-current
                >
                  {item.title}
                </Button>
              );
            })
          ) : (
            <div className="text-sm text-gray-500">
              Create a heading to display the table of contents.
            </div>
          )}
        </div>
        {children}
      </PlateElement>
    );
  }
);
