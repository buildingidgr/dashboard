import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CSSProperties, ReactNode } from "react"

interface MechBadgeProps {
  children: ReactNode
  className?: string
  dotColor?: string
  onClick?: () => void
  active?: boolean
}

export function MechBadge({ 
  children, 
  className, 
  dotColor, 
  onClick, 
  active = true 
}: MechBadgeProps) {
  return (
    <Badge
      variant="outline"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded bg-white/50 backdrop-blur-sm transition-opacity hover:opacity-70 dark:bg-gray-900/50",
        active ? "opacity-100" : "opacity-50",
        onClick && "cursor-pointer",
        className
      )}
    >
      {dotColor && (
        <div 
          className="mr-1.5 size-2 rounded-full" 
          style={{ backgroundColor: dotColor } as CSSProperties}
        />
      )}
      {children}
    </Badge>
  )
} 