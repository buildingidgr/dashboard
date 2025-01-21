import { Share2, MessageSquare, Star, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { withTooltip } from "@/components/plate-ui/tooltip"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { DocumentsService } from "@/lib/services/documents"
import { useSearchParams } from "next/navigation"

interface DocumentMetadataProps {
  title: string
  editedAt: string
  editedBy: string
  createdBy: string
  createdAt: string
  onTitleChange?: (newTitle: string) => void
}

const TooltipButton = withTooltip(Button)

export function DocumentMetadata({ title: initialTitle, editedAt, editedBy, createdBy, createdAt, onTitleChange }: DocumentMetadataProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const documentId = searchParams?.get('id')

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleTitleSubmit = async () => {
    if (!documentId) return
    try {
      await DocumentsService.updateDocument(documentId, { title })
      onTitleChange?.(title)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update document title:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      setTitle(initialTitle)
      setIsEditing(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleKeyDown}
            className="w-[200px] h-7 px-1"
          />
        ) : (
          <h1 
            className="font-medium tracking-tighter cursor-pointer hover:text-muted-foreground"
            onClick={() => setIsEditing(true)}
          >
            {title}
          </h1>
        )}
        <TooltipButton
          variant="ghost"
          size="sm"
          className="text-sm text-muted-foreground hover:text-foreground"
          tooltip={
            <div className="space-y-1">
              <p>Edited by {editedBy} {editedAt}</p>
              <p>Created by {createdBy} {createdAt}</p>
            </div>
          }
        >
          Edited {editedAt}
        </TooltipButton>
      </div>

      <div className="flex items-center gap-1">
        <TooltipButton
          variant="ghost"
          size="sm"
          className="h-8"
          tooltip="Share document"
        >
          <Share2 className="h-4 w-4" />
          <span className="ml-2">Share</span>
        </TooltipButton>
        <TooltipButton
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          tooltip="Add comment"
        >
          <MessageSquare className="h-4 w-4" />
        </TooltipButton>
        <TooltipButton
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          tooltip="Add to favorites"
        >
          <Star className="h-4 w-4" />
        </TooltipButton>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48">
            <div className="space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Add to favorites
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                Copy link
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-destructive">
                Delete
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
} 