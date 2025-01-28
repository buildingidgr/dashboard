"use client"

import { useEffect, useState } from 'react'
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
    topOffset: 200, // Increased offset to account for all sticky elements
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
    console.log('Clicked heading:', heading)
    if (!editor) {
      console.log('No editor found')
      return
    }

    // Find the heading element
    const headingElement = document.querySelector(`[data-slate-node="element"][data-slate-type="h${heading.level}"]`) as HTMLElement
    if (!headingElement) {
      console.log('Heading element not found')
      return
    }

    e.preventDefault();

    // Use Plate's built-in scroll functionality
    onContentScroll({
      id: heading.id,
      el: headingElement,
      behavior: 'smooth'
    });
  }

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
                  activeContentId === heading.id && "bg-accent/50"
                )}
                onClick={(e) => handleClick(heading, e)}
                onMouseEnter={() => setMouseInToc(true)}
                onMouseLeave={() => setMouseInToc(false)}
              >
                <div 
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-[4px] rounded-full transition-colors",
                    activeContentId === heading.id 
                      ? "bg-muted-foreground/50" 
                      : "bg-muted-foreground/40 group-hover:bg-muted-foreground/90"
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