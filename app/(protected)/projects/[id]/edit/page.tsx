"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePageTitle } from "@/components/layouts/client-layout"
import { ProjectForm } from "@/components/projects/project-form"
import { Project, mockProjects } from "../../mock-data"

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { setTitle, setDescription } = usePageTitle()
  const projectId = params?.id as string

  // Find the project by ID
  const project = mockProjects.find(p => p.id === projectId)

  useEffect(() => {
    if (!project) {
      router.push("/projects")
      return
    }

    setTitle("Edit Project")
    setDescription(`Edit details for ${project.name}`)
  }, [project, router, setTitle, setDescription])

  if (!project) {
    return null
  }

  return (
    <ProjectForm 
      mode="edit"
      projectId={projectId}
      initialData={{
        name: project.name,
        type: project.type,
        description: project.description,
        location: {
          address: project.location.address,
          city: project.location.city,
          state: project.location.state,
          postalCode: "", // Add default value
        },
        details: {
          totalArea: project.details.totalArea.toString(),
          estimatedDuration: project.details.estimatedDuration.toString(),
          constructionType: project.details.constructionType,
          budget: "", // Add default value
        },
        permits: {
          required: [],
          status: "pending",
          notes: "",
        },
        contactId: undefined,
      }}
    />
  )
} 