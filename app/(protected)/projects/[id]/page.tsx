"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePageTitle } from "@/components/layouts/client-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Building2, 
  Calendar, 
  MapPin, 
  ArrowLeft,
  Clock,
  HardHat,
  Construction,
  FileText,
  Pencil
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"

// Import the mock data and types
import { mockProjects, type Project } from "../page"

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params?.id as string
  const router = useRouter()
  const { setTitle, setDescription } = usePageTitle()
  const [project, setProject] = useState<Project | undefined>(
    mockProjects.find(p => p.id === projectId)
  )

  useEffect(() => {
    if (!project) {
      router.push("/projects")
      return
    }

    setTitle(project.name)
    setDescription(`${project.type.charAt(0).toUpperCase() + project.type.slice(1)} Project`)
  }, [project, setTitle, setDescription, router])

  if (!project) return null

  return (
    <div className="space-y-6">
      {/* Back button and actions */}
      <div className="flex items-center justify-between">
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

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            asChild
          >
            <Link href={`/projects/${projectId}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            <Badge 
              variant={
                project.status === 'active' ? 'default' :
                project.status === 'completed' ? 'secondary' :
                'outline'
              }
              className="capitalize"
            >
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Total Area</p>
                      <p className="text-2xl font-bold">{project.details.totalArea} m²</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-2xl font-bold">{project.details.estimatedDuration} months</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Construction className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Construction Type</p>
                      <p className="text-lg font-medium">{project.details.constructionType}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-lg font-medium">
                        {format(new Date(project.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Location Information */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Location</h3>
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{project.location.address}</span>
                </div>
                <div className="text-muted-foreground pl-6">
                  {project.location.city}, {project.location.state}
                </div>
              </div>
            </div>

            <Separator />

            {/* Project Details */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Project Details</h3>
              <div className="grid gap-4">
                <div className="flex items-start gap-2">
                  <HardHat className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Construction Type</p>
                    <p className="text-muted-foreground">{project.details.constructionType}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Project Description</p>
                    <p className="text-muted-foreground">{project.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 