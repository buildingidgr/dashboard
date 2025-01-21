"use client"

import { useEffect } from "react"
import { usePageTitle } from "@/components/layouts/client-layout"
import { ProjectForm } from "@/components/projects/project-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewProjectPage() {
  const { setTitle, setDescription } = usePageTitle()

  useEffect(() => {
    setTitle("Create New Project")
    setDescription("Create a new civil engineering project")
  }, [setTitle, setDescription])

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        asChild
      >
        <Link href="/projects">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </Button>

      <ProjectForm />
    </div>
  )
} 