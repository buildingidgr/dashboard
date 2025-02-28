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
        "rounded cursor-pointer hover:opacity-70 transition-opacity bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm",
        active ? "opacity-100" : "opacity-50",
        onClick && "cursor-pointer",
        className
      )}
    >
      {dotColor && (
        <div 
          className="w-2 h-2 rounded-full mr-1.5" 
          style={{ backgroundColor: dotColor } as CSSProperties}
        />
      )}
      {children}
    </Badge>
  )
} 