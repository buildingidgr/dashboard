"use client"

import { useState, useEffect } from "react"
import { HelpCircle, CheckCircle2, ChevronRight, ArrowLeft, ArrowRight, X, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const STORAGE_KEY = "onboarding-progress"

interface VisualAid {
  type: "screenshot" | "gif" | "video"
  src: string
  alt: string
  width: number
  height: number
  hotspots?: Array<{
    x: number
    y: number
    label: string
    description: string
  }>
}

interface TutorialStep {
  description: string
  visualAid?: VisualAid
  action?: {
    label: string
    path: string
  }
}

interface Tutorial {
  title: string
  steps: TutorialStep[]
}

interface PlatformCapability {
  id: string
  title: string
  description: string
  tutorial: Tutorial
}

export function OnboardingGuide() {
  const [open, setOpen] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [expandedImage, setExpandedImage] = useState<VisualAid | null>(null)
  const router = useRouter()

  const platformCapabilities: PlatformCapability[] = [
    {
      id: "project-management",
      title: "Project Management",
      description: "Create and manage your engineering projects with ease. Track progress, set milestones, and collaborate with team members.",
      tutorial: {
        title: "Getting Started with Project Management",
        steps: [
          {
            description: "Navigate to the Projects section to see all your engineering projects in one place.",
            visualAid: {
              type: "screenshot",
              src: "/onboarding/projects-overview.png",
              alt: "Projects Overview Page",
              width: 800,
              height: 450,
              hotspots: [
                {
                  x: 20,
                  y: 30,
                  label: "Projects Menu",
                  description: "Click here to access your projects"
                },
                {
                  x: 80,
                  y: 20,
                  label: "New Project",
                  description: "Create a new project from here"
                }
              ]
            },
            action: {
              label: "Go to Projects",
              path: "/projects"
            }
          },
          {
            description: "Create your first project by clicking the 'New Project' button. Fill in the project details like name, description, and timeline.",
            visualAid: {
              type: "gif",
              src: "/onboarding/create-project.gif",
              alt: "Creating a New Project",
              width: 800,
              height: 450
            }
          },
          {
            description: "Add team members to your project and assign them roles. This will determine their access levels and responsibilities.",
            visualAid: {
              type: "screenshot",
              src: "/onboarding/team-management.png",
              alt: "Team Management Interface",
              width: 800,
              height: 450,
              hotspots: [
                {
                  x: 60,
                  y: 40,
                  label: "Add Member",
                  description: "Click to add new team members"
                },
                {
                  x: 75,
                  y: 60,
                  label: "Role Selection",
                  description: "Choose member roles and permissions"
                }
              ]
            }
          },
          {
            description: "Set up project milestones to track major deliverables and keep the team aligned on goals.",
            visualAid: {
              type: "screenshot",
              src: "/onboarding/milestones.png",
              alt: "Project Milestones",
              width: 800,
              height: 450
            }
          }
        ]
      }
    },
    {
      id: "document-collaboration",
      title: "Document Collaboration",
      description: "Share and collaborate on technical documents, specifications, and project plans in real-time.",
      tutorial: {
        title: "Document Collaboration Basics",
        steps: [
          {
            description: "Access the Documents section to view all project-related documents.",
            action: {
              label: "Open Documents",
              path: "/documents"
            }
          },
          {
            description: "Create a new document using our rich text editor. You can add text, images, code blocks, and more."
          },
          {
            description: "Share your document with team members by clicking the 'Share' button and setting appropriate permissions."
          },
          {
            description: "Use comments and suggestions to provide feedback and collaborate with others in real-time."
          }
        ]
      }
    },
    {
      id: "resource-management",
      title: "Resource Management",
      description: "Efficiently manage and allocate resources across projects. Track availability and utilization of team members.",
      tutorial: {
        title: "Resource Management Guide",
        steps: [
          {
            description: "Visit the Resources dashboard to see an overview of all available resources.",
            action: {
              label: "View Resources",
              path: "/resources"
            }
          },
          {
            description: "Check team member availability using the calendar view. This helps in planning and allocation."
          },
          {
            description: "Assign resources to projects based on their skills and availability."
          },
          {
            description: "Monitor resource utilization through detailed analytics and reports."
          }
        ]
      }
    },
    {
      id: "task-tracking",
      title: "Task Tracking",
      description: "Create, assign, and track tasks within projects. Set priorities, deadlines, and monitor progress.",
      tutorial: {
        title: "Task Management Tutorial",
        steps: [
          {
            description: "Go to the Tasks section to manage all project-related tasks.",
            action: {
              label: "Open Tasks",
              path: "/tasks"
            }
          },
          {
            description: "Create a new task by specifying its title, description, priority, and deadline."
          },
          {
            description: "Assign tasks to team members and set up dependencies if needed."
          },
          {
            description: "Track task progress and update status as work progresses."
          }
        ]
      }
    },
    {
      id: "team-communication",
      title: "Team Communication",
      description: "Built-in communication tools to facilitate team discussions, updates, and decision-making.",
      tutorial: {
        title: "Communication Tools Overview",
        steps: [
          {
            description: "Access the Team Chat to start communicating with your team members.",
            action: {
              label: "Open Chat",
              path: "/chat"
            }
          },
          {
            description: "Create channels for different topics or projects to organize discussions."
          },
          {
            description: "Use @mentions to notify specific team members in discussions."
          },
          {
            description: "Schedule and join video meetings directly from the platform."
          }
        ]
      }
    },
    {
      id: "opportunities",
      title: "Opportunities",
      description: "Discover and manage engineering opportunities. Browse available projects, submit proposals, and track your applications.",
      tutorial: {
        title: "Exploring Opportunities",
        steps: [
          {
            description: "Visit the Opportunities section to browse available engineering projects and contracts.",
            visualAid: {
              type: "screenshot",
              src: "/onboarding/opportunities-overview.png",
              alt: "Opportunities Overview",
              width: 800,
              height: 450,
              hotspots: [
                {
                  x: 15,
                  y: 25,
                  label: "Filters",
                  description: "Filter opportunities by type, location, and expertise"
                },
                {
                  x: 85,
                  y: 25,
                  label: "Search",
                  description: "Search for specific opportunities"
                }
              ]
            },
            action: {
              label: "View Opportunities",
              path: "/public-opportunities"
            }
          },
          {
            description: "Review opportunity details including requirements, timeline, and compensation. Use filters to find opportunities that match your expertise.",
            visualAid: {
              type: "screenshot",
              src: "/onboarding/opportunity-details.png",
              alt: "Opportunity Details",
              width: 800,
              height: 450,
              hotspots: [
                {
                  x: 70,
                  y: 30,
                  label: "Apply Button",
                  description: "Click to submit your application"
                },
                {
                  x: 20,
                  y: 60,
                  label: "Requirements",
                  description: "Review project requirements and qualifications"
                }
              ]
            }
          },
          {
            description: "Submit your application by providing relevant experience, availability, and any additional requirements.",
            visualAid: {
              type: "gif",
              src: "/onboarding/submit-application.gif",
              alt: "Submitting an Application",
              width: 800,
              height: 450
            }
          },
          {
            description: "Track your applications and manage communication with potential clients through the platform.",
            visualAid: {
              type: "screenshot",
              src: "/onboarding/application-tracking.png",
              alt: "Application Tracking",
              width: 800,
              height: 450,
              hotspots: [
                {
                  x: 30,
                  y: 40,
                  label: "Status",
                  description: "Check your application status"
                },
                {
                  x: 70,
                  y: 40,
                  label: "Messages",
                  description: "Communicate with the client"
                }
              ]
            }
          }
        ]
      }
    }
  ]

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY)
    if (savedProgress) {
      setCompletedSteps(JSON.parse(savedProgress))
    }
  }, [])

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedSteps))
  }, [completedSteps])

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => {
      if (prev.includes(stepId)) {
        return prev.filter(id => id !== stepId)
      }
      return [...prev, stepId]
    })
  }

  const progress = Math.round((completedSteps.length / platformCapabilities.length) * 100)

  const resetProgress = () => {
    setCompletedSteps([])
    setActiveTutorial(null)
    setCurrentStep(0)
  }

  const startTutorial = (capabilityId: string) => {
    setActiveTutorial(capabilityId)
    setCurrentStep(0)
  }

  const closeTutorial = () => {
    setActiveTutorial(null)
    setCurrentStep(0)
  }

  const currentTutorial = activeTutorial 
    ? platformCapabilities.find(cap => cap.id === activeTutorial)?.tutorial 
    : null

  const handleAction = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  const renderVisualAid = (visualAid: VisualAid, isExpanded: boolean = false) => {
    const imageComponent = (
      <div className={cn(
        "relative rounded-lg overflow-hidden",
        isExpanded ? "w-full h-full" : "w-full max-h-[300px]"
      )}>
        <Image
          src={visualAid.src}
          alt={visualAid.alt}
          width={visualAid.width}
          height={visualAid.height}
          className="object-cover w-full h-full"
        />
        {!isExpanded && visualAid.hotspots && visualAid.hotspots.map((hotspot, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute w-6 h-6 rounded-full bg-primary/80 cursor-pointer animate-pulse"
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-semibold">{hotspot.label}</p>
                  <p className="text-sm text-muted-foreground">{hotspot.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {!isExpanded && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 hover:bg-background"
            onClick={() => setExpandedImage(visualAid)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    )

    return imageComponent
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <HelpCircle className="h-5 w-5" />
            {progress > 0 && progress < 100 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                {completedSteps.length}
              </span>
            )}
            {progress === 100 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </span>
            )}
            <span className="sr-only">Open onboarding guide</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px]">
          {!activeTutorial ? (
            <>
              <DialogHeader>
                <DialogTitle>Welcome to the Platform</DialogTitle>
                <DialogDescription>
                  Let&apos;s explore the key features and capabilities of our engineering management platform.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Your progress</span>
                    <span>{progress}% complete</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="grid gap-6">
                  {platformCapabilities.map((capability) => (
                    <div 
                      key={capability.id}
                      className={cn(
                        "space-y-2 p-4 rounded-lg transition-colors",
                        completedSteps.includes(capability.id) 
                          ? "bg-muted" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0"
                          onClick={() => toggleStep(capability.id)}
                        >
                          <CheckCircle2 
                            className={cn(
                              "h-5 w-5 transition-colors",
                              completedSteps.includes(capability.id) 
                                ? "text-primary" 
                                : "text-muted-foreground"
                            )} 
                          />
                        </Button>
                        <h3 className="font-semibold leading-none tracking-tight">
                          {capability.title}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          onClick={() => startTutorial(capability.id)}
                        >
                          Start Tutorial
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground pl-7">
                        {capability.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={resetProgress}>Reset Progress</Button>
              </DialogFooter>
            </>
          ) : currentTutorial ? (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{currentTutorial.title}</DialogTitle>
                  <Button variant="ghost" size="icon" onClick={closeTutorial}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <DialogDescription>
                  Step {currentStep + 1} of {currentTutorial.steps.length}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <Progress 
                    value={(currentStep + 1) / currentTutorial.steps.length * 100} 
                    className="h-2" 
                  />
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">
                        {currentTutorial.steps[currentStep].description}
                      </p>
                      {currentTutorial.steps[currentStep].action && (
                        <Button
                          className="mt-4"
                          onClick={() => handleAction(currentTutorial.steps[currentStep].action!.path)}
                        >
                          {currentTutorial.steps[currentStep].action.label}
                        </Button>
                      )}
                    </div>
                    {currentTutorial.steps[currentStep].visualAid && (
                      <div className="mt-4">
                        {renderVisualAid(currentTutorial.steps[currentStep].visualAid!)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => {
                      if (currentStep === currentTutorial.steps.length - 1) {
                        toggleStep(activeTutorial)
                        closeTutorial()
                      } else {
                        setCurrentStep(prev => prev + 1)
                      }
                    }}
                  >
                    {currentStep === currentTutorial.steps.length - 1 ? (
                      "Complete"
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
                <Button variant="ghost" onClick={closeTutorial}>
                  Exit Tutorial
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Image Expansion Dialog */}
      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{expandedImage?.alt}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[calc(90vh-10rem)]">
            {expandedImage && renderVisualAid(expandedImage, true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 