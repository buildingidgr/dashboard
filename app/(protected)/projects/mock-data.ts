export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'on-hold'
  type: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'renovation'
  location: {
    address: string
    city: string
    state: string
  }
  details: {
    totalArea: number
    estimatedDuration: number
    constructionType: string
  }
  createdAt: string
}

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "Marina Heights Residential Complex",
    description: "A modern 12-story residential building with 48 luxury apartments, underground parking, and rooftop amenities.",
    status: "active",
    type: "residential",
    location: {
      address: "125 Coastal Avenue",
      city: "Piraeus",
      state: "Attica"
    },
    details: {
      totalArea: 8500,
      estimatedDuration: 24,
      constructionType: "Reinforced Concrete"
    },
    createdAt: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    name: "Central Metro Station Renovation",
    description: "Structural renovation and seismic retrofitting of the historic central metro station, including platform expansion and accessibility improvements.",
    status: "on-hold",
    type: "infrastructure",
    location: {
      address: "45 Metro Square",
      city: "Athens",
      state: "Attica"
    },
    details: {
      totalArea: 3200,
      estimatedDuration: 18,
      constructionType: "Steel and Concrete Composite"
    },
    createdAt: "2023-12-01T09:30:00Z"
  }
] 