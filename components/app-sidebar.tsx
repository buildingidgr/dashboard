"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  GalleryVerticalEnd,
  FolderIcon,
  Plus,
} from "lucide-react"
import { useTheme } from "@/components/layouts/client-layout"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { DocumentsService } from '@/lib/services/documents';
import { toast } from 'sonner';

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDarkMode } = useTheme()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = React.useState(0)

  const handleCreateDocument = async () => {
    try {
      const doc = await DocumentsService.createDocument()
      router.push(`/editor?id=${doc.id}`)
      setRefreshKey(key => key + 1)
      toast.success('New document created')
    } catch (error) {
      console.error('Failed to create document:', error)
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          toast.error('Network error: Please check your internet connection')
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          toast.error('Session expired. Please sign in again')
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          toast.error('Document limit reached. Please upgrade your plan')
        } else {
          toast.error(`Failed to create document: ${error.message}`)
        }
      } else {
        toast.error('An unexpected error occurred while creating the document')
      }
    }
  }

  const data = {
    teams: [
      {
        name: "Personal Account",
        logo: GalleryVerticalEnd,
        plan: "Free",
      }
    ],
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: true,
      },
      {
        title: "Documents",
        url: "/editor",
        icon: FolderIcon,
        isDynamic: true,
        action: {
          icon: Plus,
          onClick: handleCreateDocument
        }
      },
      {
        title: "Opportunities",
        url: "#",
        icon: FileText,
        items: [
          {
            title: "Public Opportunities",
            url: "/public-opportunities",
          },
          {
            title: "Claimed Opportunities",
            url: "/claimed",
          }
        ],
      },
      {
        title: "Projects",
        url: "/projects",
        icon: FileText,
      },
      {
        title: "Contacts",
        url: "/contacts",
        icon: Users,
        items: [
          {
            title: "All Contacts",
            url: "/contacts",
          },
          {
            title: "Add Contact",
            url: "/contacts/new",
          }
        ],
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      }
    ]
  }

  return (
    <Sidebar 
      collapsible="icon" 
      className={cn(
        "border-r",
        "[&_[data-sidebar=sidebar]]:bg-background",
        "[&_[data-sidebar=separator]]:bg-border",
        isDarkMode && "text-foreground [&_[data-sidebar=sidebar]]:bg-background"
      )}
      {...props}
    >
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain 
          items={data.navMain} 
          onCreateDocument={handleCreateDocument}
          documentListKey={refreshKey}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail className="after:bg-border hover:after:bg-border/80" />
    </Sidebar>
  )
}
