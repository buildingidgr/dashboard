"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Building2,
  User,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Personal Account",
      logo: GalleryVerticalEnd,
      plan: "Free",
    }
  ],
  navMain: [
    {
      title: "Projects",
      url: "#",
      icon: Building2,
      items: [
        {
          title: "Public Projects",
          url: "/public-projects",
        },
        {
          title: "Claimed Projects",
          url: "/claimed",
        }
      ],
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
      title: "Profile",
      url: "/profile",
      icon: User,
      items: [
        {
          title: "Personal Info",
          url: "/profile?tab=personal",
        },
        {
          title: "Professional Info",
          url: "/profile?tab=professional",
        },
        {
          title: "Preferences",
          url: "/profile?tab=preferences",
        }
      ],
    }
  ],
  projects: [] // You can remove this if not needed
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
