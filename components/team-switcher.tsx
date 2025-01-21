"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/layouts/client-layout"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface TeamSwitcherProps {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const { isMobile } = useSidebar()
  const { isDarkMode } = useTheme()
  const TeamLogo = teams[0].logo

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "data-[state=open]:bg-secondary data-[state=open]:text-secondary-foreground",
                "hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              <TeamLogo className="h-5 w-5 text-muted-foreground" />
              <span>{teams[0].name}</span>
              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium leading-none text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            {teams.map((team) => {
              const Logo = team.logo
              return (
                <DropdownMenuItem
                  key={team.name}
                  className="hover:bg-secondary hover:text-secondary-foreground"
                >
                  <Logo className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{team.name}</span>
                  <DropdownMenuShortcut className="text-muted-foreground">
                    {team.plan}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-secondary hover:text-secondary-foreground">
              <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
              Create Team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
