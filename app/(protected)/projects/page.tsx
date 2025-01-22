"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, MapPin, Calendar, Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePageTitle } from "@/components/layouts/client-layout"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Project, mockProjects } from "./mock-data"

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const { setTitle, setDescription } = usePageTitle()
  
  // Filter projects based on search and status
  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = activeTab === "all" || project.status === activeTab
    return matchesSearch && matchesStatus
  })

  useEffect(() => {
    setTitle("Projects")
    setDescription("Create and manage your civil engineering projects")
  }, [setTitle, setDescription])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="py-4 flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="on-hold">On Hold</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button asChild>
            <Link href="/projects/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No projects found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery 
                  ? "Try adjusting your search or filters"
                  : "Create your first civil engineering project to get started"
                }
              </p>
              {!searchQuery && (
                <Button asChild className="mt-4">
                  <Link href="/projects/new" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Project
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
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
                <div className="grid gap-4">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{project.details.totalArea} m²</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{project.details.estimatedDuration} months</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{project.location.city}, {project.location.state}</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" asChild>
                      <Link href={`/projects/${project.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 