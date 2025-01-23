import { categoryColors } from "@/constants/map-categories"
import { CSSProperties } from "react"

export function ProjectTypesLegend() {
  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm py-2 px-4 rounded-full shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4 flex-wrap">
      {(Object.entries(categoryColors) as [string, string][]).map(([category, color]) => (
        <div key={category} className="flex items-center gap-1.5">
          <div 
            className="w-2 h-2 rounded-full border border-white/50 dark:border-gray-800/50 shadow-sm flex-shrink-0" 
            style={{ backgroundColor: color } as CSSProperties}
          />
          <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{category}</span>
        </div>
      ))}
    </div>
  )
} 