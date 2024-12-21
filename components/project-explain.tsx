import { Card } from "@/components/ui/card"
import { Search, MapPin, UserPlus, ArrowRight, Building2, Clock } from "lucide-react"

const features = [
  {
    icon: Search,
    title: "Browse Projects",
    description: "Explore available projects in your area. Filter by type and find opportunities that match your expertise.",
    step: 1,
    color: "bg-blue-50 text-blue-600"
  },
  {
    icon: Building2,
    title: "Review Details",
    description: "Get detailed information about each project, including location, requirements, and scope of work.",
    step: 2,
    color: "bg-green-50 text-green-600"
  },
  {
    icon: Clock,
    title: "Claim Projects",
    description: "Claim projects that interest you and get access to full project details and customer information.",
    step: 3,
    color: "bg-purple-50 text-purple-600"
  }
]

export default function ProjectExplain() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <Card 
          key={index}
          className="relative p-6 bg-white hover:shadow-lg transition-all duration-300 border-none overflow-hidden group"
        >
          {/* Background Pattern */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent transform rotate-45 translate-x-16 -translate-y-16 group-hover:translate-x-14 group-hover:-translate-y-14 transition-transform duration-300" />
          
          <div className="relative">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
              <feature.icon className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-500">Step {feature.step}</span>
              <ArrowRight className="w-4 h-4 ml-2 text-gray-400" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

