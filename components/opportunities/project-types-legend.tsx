import { categoryColors, simplifiedLabels } from "@/constants/map-categories"
import { MechBadge } from "@/components/ui/mech-badge"

interface ProjectTypesLegendProps {
  selectedType: string
  onTypeChange: (type: string) => void
}

export function ProjectTypesLegend({ selectedType, onTypeChange }: ProjectTypesLegendProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <MechBadge 
        onClick={() => onTypeChange("all")}
        active={selectedType === "all"}
        dotColor="#9CA3AF"
      >
        All
      </MechBadge>
      {(Object.entries(categoryColors) as [string, string][]).filter(([category]) => category !== 'Other').map(([category, color]) => (
        <MechBadge
          key={category}
          onClick={() => onTypeChange(category)}
          active={selectedType === category}
          dotColor={color}
        >
          {simplifiedLabels[category]}
        </MechBadge>
      ))}
    </div>
  )
} 