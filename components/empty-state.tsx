import Image from "next/image"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionOnClick?: () => void
  imagePath?: string
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  actionOnClick,
  imagePath = "/empty-state.svg" // default path to your SVG
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[450px]  p-8 text-center">
      <div className="w-52 h-52 mb-6 relative">
        <Image
          src={imagePath}
          alt={title}
          fill
          className="object-contain"
          priority
        />
      </div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      {actionLabel && actionOnClick && (
        <Button onClick={actionOnClick}>{actionLabel}</Button>
      )}
    </div>
  )
}

