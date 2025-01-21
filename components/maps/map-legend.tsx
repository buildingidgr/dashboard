import { categoryColors } from "@/constants/map-categories"
import { CSSProperties } from "react"

export const MapLegend = () => (
  <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
    <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Project Types</h4>
    <div className="space-y-2">
      {(Object.entries(categoryColors) as [string, string][]).map(([category, color]) => (
        <div key={category} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full border border-white dark:border-gray-800 shadow-sm" 
            style={{ backgroundColor: color } as CSSProperties}
          />
          <span className="text-xs text-gray-700 dark:text-gray-300">{category}</span>
        </div>
      ))}
    </div>
  </div>
) 