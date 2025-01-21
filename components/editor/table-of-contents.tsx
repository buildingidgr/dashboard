"use client"

import { useEffect, useState } from 'react'
import { useEditorRef, useEditorState } from '@udecode/plate-common/react'
import { findNode, getNodeString, getNodeEntries } from '@udecode/plate-common'
import { type TNode, type TEditor, type TNodeEntry, type TElement } from '@udecode/plate-common'
import { HEADING_KEYS, isHeading } from '@udecode/plate-heading'
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
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const editor = useEditorState()
  const editorRef = useEditorRef()

  useEffect(() => {
    if (!editor || !editorRef) return

    // Function to extract headings from the editor
    const extractHeadings = () => {
      const items: TocItem[] = []
      
      const values = getNodeEntries(editor, {
        at: [],
        match: (n) => isHeading(n),
      })

      if (!values) return

      Array.from(values, ([node, path]) => {
        const { type } = node as TElement
        const text = getNodeString(node)
        const level = headingDepth[type]
        const id = `heading-${path[0]}`

        if (text) {
          items.push({
            id,
            text,
            level,
            path
          })

          // Set ID on the DOM element
          const element = document.querySelector(`[data-slate-node="element"][data-slate-type="${type}"]`)
          if (element && !element.id) {
            element.id = id
          }
        }
      })

      setHeadings(items)
    }

    // Initial extraction
    extractHeadings()

    // Set up observer for content changes
    const observer = new MutationObserver(extractHeadings)
    const editorElement = document.querySelector('[data-slate-editor="true"]')
    
    if (editorElement) {
      observer.observe(editorElement, { 
        childList: true, 
        subtree: true,
        characterData: true 
      })
    }

    // Set up intersection observer for active heading
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-20% 0px -60% 0px'
      }
    )

    // Observe all heading elements
    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        intersectionObserver.observe(element)
      }
    })

    return () => {
      observer.disconnect()
      intersectionObserver.disconnect()
    }
  }, [editor, editorRef])

  const handleClick = (heading: TocItem) => {
    if (!editor) return

    // Find the heading element
    const element = document.querySelector(`[data-slate-node="element"][data-slate-type="${'h' + heading.level}"]`)
    if (!element) return

    // Get the fixed toolbar height
    const toolbar = document.querySelector('.sticky.top-0')
    const toolbarHeight = toolbar?.getBoundingClientRect().height || 0

    // Get the editor container
    const editorContainer = document.querySelector('.flex-1.overflow-auto')
    if (!editorContainer) return

    // Calculate the scroll position
    const containerRect = editorContainer.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    const scrollTop = elementRect.top - containerRect.top + editorContainer.scrollTop - toolbarHeight - 20

    // Scroll the editor container
    editorContainer.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    })

    // Set active heading
    setActiveId(heading.id)
  }

  return (
    <div className="sticky top-[120px] w-full px-2">
      <div className="space-y-0.5">
        {headings.map((heading) => (
          <Tooltip key={heading.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <button 
                className={cn(
                  "w-full h-4 px-2 group relative transition-colors rounded-sm",
                  activeId === heading.id && "bg-accent/50"
                )}
                onClick={() => handleClick(heading)}
              >
                <div 
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-[2px] rounded-full transition-colors",
                    activeId === heading.id 
                      ? "bg-muted-foreground/50" 
                      : "bg-muted group-hover:bg-muted-foreground/50"
                  )}
                  style={{
                    width: `${100 - (heading.level - 1) * 10}%`,
                    left: `${(heading.level - 1) * 10}%`
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