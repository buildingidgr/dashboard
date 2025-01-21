export interface Project {
  _id: string
  type?: string
  description?: string
  changedAt?: string
  data?: {
    project: {
      category: {
        title: string
        description: string
      }
      location: {
        address: string
        coordinates: {
          lat: number
          lng: number
        }
      }
      details: {
        description: string
      }
    }
    metadata: {
      submittedAt: string
      locale: string
      source: string
      version: string
    }
  }
  address?: {
    street: string
    unit?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  contactId?: string
  contact?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phones: Array<{
      type: string
      number: string
      primary: boolean
    }>
    company?: {
      name: string
      title?: string
    }
  }
} 