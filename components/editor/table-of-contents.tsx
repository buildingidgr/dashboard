"use client"

import { useEffect, useState, useRef } from 'react'
import { useEditorRef, useEditorState } from '@udecode/plate-common/react'
import { getNodeString, getNodeEntries } from '@udecode/plate-common'
import { type TElement } from '@udecode/plate-common'
import { HEADING_KEYS, isHeading } from '@udecode/plate-heading'
import { useTocSideBarState, useTocSideBar } from '@udecode/plate-heading/react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface TocItem {
  id: string
  text: string
  level: number
  path: number[]
}

const headingDepth: Record<string, number> = {
  [HEADING_KEYS.h1]: 1,
  [HEADING_KEYS.h2]: 2,
  [HEADING_KEYS.h3]: 3,
  [HEADING_KEYS.h4]: 4,
  [HEADING_KEYS.h5]: 5,
  [HEADING_KEYS.h6]: 6,
};

export function TableOfContents() {
  const editor = useEditorState()
  const editorRef = useEditorRef()
  const [currentHeadingId, setCurrentHeadingId] = useState<string>('');

  // Use Plate's TOC sidebar state with adjusted offset
  const {
    headingList,
    activeContentId,
    tocRef,
    mouseInToc,
    setMouseInToc,
    setIsObserve,
    onContentScroll,
  } = useTocSideBarState({
    topOffset: 200,
  })

  // Get TOC sidebar props and handlers
  const { navProps } = useTocSideBar({
    activeContentId,
    editor,
    headingList,
    mouseInToc,
    open: true,
    setMouseInToc,
    setIsObserve,
    tocRef,
    onContentScroll,
  })

  const handleClick = (heading: TocItem, e: React.MouseEvent) => {
    if (!editor) return;

    // Find the heading element by text content since IDs might not be reliable
    const headingElements = document.querySelectorAll(`[data-slate-node="element"][data-slate-type="h${heading.level}"]`);
    const headingElement = Array.from(headingElements).find(el => el.textContent === heading.text) as HTMLElement;
    
    if (!headingElement) return;

    // Ensure the heading has an ID
    if (!headingElement.id) {
      headingElement.id = heading.id;
    }

    e.preventDefault();
    setCurrentHeadingId(heading.id);

    // Scroll to the heading using Plate's built-in functionality
    onContentScroll({
      id: heading.id,
      el: headingElement,
      behavior: 'smooth'
    });
  }

  // Ensure headings have IDs that match our TOC
  useEffect(() => {
    headingList.forEach(heading => {
      const headingElements = document.querySelectorAll(`[data-slate-node="element"][data-slate-type="h${heading.depth}"]`);
      const headingElement = Array.from(headingElements).find(el => el.textContent === heading.title);
      if (headingElement && !headingElement.id) {
        headingElement.id = heading.id;
      }
    });
  }, [headingList]);

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = document.querySelectorAll('[data-slate-node="element"][data-slate-type^="h"]');
      const viewportHeight = window.innerHeight;
      
      interface ClosestHeading {
        id: string;
        distance: number;
      }

      // Find the heading that's closest to the top of the viewport
      let closestHeading: ClosestHeading | null = null;

      headingElements.forEach((element: Element) => {
        const rect = element.getBoundingClientRect();
        const distance = Math.abs(rect.top - 200); // 200px offset to match topOffset

        // Update closest heading if this one is closer to the target position
        if (!closestHeading || distance < closestHeading.distance) {
          closestHeading = { 
            id: element.getAttribute('id') || '', 
            distance 
          };
        }
      });

      // Update current heading ID if we found a heading and we're not hovering over TOC
      if (closestHeading?.id && !mouseInToc) {
        setCurrentHeadingId(closestHeading.id);
      }
    };

    // Throttle the scroll handler to improve performance
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener);
    return () => window.removeEventListener('scroll', scrollListener);
  }, [mouseInToc]);

  // Map headings to our TocItem format
  const headings: TocItem[] = headingList.map(heading => ({
    id: heading.id || `heading-${heading.path[0]}`,
    text: heading.title,
    level: heading.depth,
    path: heading.path
  }))

  return (
    <div className="w-full" ref={tocRef as any}>
      <div className="space-y-[2px]">
        {headings.map((heading) => (
          <Tooltip key={heading.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <button 
                className={cn(
                  "w-full h-1 group relative transition-colors rounded-sm",
                  currentHeadingId === heading.id && "bg-accent/50"
                )}
                onClick={(e) => handleClick(heading, e)}
                onMouseEnter={() => setMouseInToc(true)}
                onMouseLeave={() => setMouseInToc(false)}
              >
                <div 
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-[4px] rounded-full transition-colors",
                    currentHeadingId === heading.id 
                      ? "bg-muted-foreground/90"
                      : "bg-muted-foreground/40 group-hover:bg-muted-foreground/90",
                    currentHeadingId === heading.id && "shadow-sm shadow-accent"
                  )}
                  style={{
                    width: `${70 - (heading.level - 1) * 20}%`,
                    left: `${(heading.level - 1) * 20}%`
                  }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              className="py-1 px-2"
              sideOffset={5}
            >
              <span className="text-xs">{heading.text}</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
} 