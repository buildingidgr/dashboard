"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePageTitle } from "@/components/layouts/client-layout"
import { ProjectForm } from "@/components/projects/project-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { mockProjects } from "../../page"

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { setTitle } = usePageTitle()
  const projectId = params?.id as string
  const project = mockProjects.find(p => p.id === projectId)

  useEffect(() => {
    if (!project) {
      router.push("/projects")
      return
    }

    setTitle(`Edit ${project.name}`)
  }, [project, setTitle, router])

  if (!project) return null

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        asChild
      >
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>
      </Button>

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
            postalCode: "", // Add this to your mock data if needed
          },
          details: {
            totalArea: project.details.totalArea.toString(),
            estimatedDuration: project.details.estimatedDuration.toString(),
            constructionType: project.details.constructionType,
            budget: "", // Add this to your mock data if needed
          },
          permits: {
            required: [],
            status: "pending",
            notes: "",
          },
          contactId: undefined, // Add this to your mock data if needed
        }}
      />
    </div>
  )
} 