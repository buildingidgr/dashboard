import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ReactNode } from "react"

interface MechDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

export function MechDialog({ 
  open, 
  onOpenChange,
  title,
  description,
  children,
  footer,
  className: _className
}: MechDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(640px,80vh)] sm:max-w-lg [&>button:last-child]:hidden">
        <div className="overflow-y-auto">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="px-6 pt-6 text-base">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="px-6">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="p-6 pt-2">
            {children}
          </div>
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          {footer || (
            <>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button type="button">
                  Okay
                </Button>
              </DialogClose>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 