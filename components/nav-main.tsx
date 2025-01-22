"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/layouts/client-layout"
import { Button } from "@/components/ui/button"
import { DocumentsList } from '@/components/documents/documents-list'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface NavMainProps {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    isDynamic?: boolean
    action?: {
      icon: LucideIcon
      onClick: () => void
    }
    items?: {
      title: string
      url: string
    }[]
  }[]
  onCreateDocument?: () => void
  documentListKey?: number
}

export function NavMain({ items, onCreateDocument, documentListKey }: NavMainProps) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-muted-foreground">Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // Handle dynamic document section
          if (item.isDynamic) {
            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url} passHref legacyBehavior>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    className="hover:bg-secondary hover:text-secondary-foreground"
                  >
                    {item.icon && <item.icon className="h-4 w-4 text-muted-foreground" />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
          }

          // Handle regular menu items
          if (!item.items?.length) {
            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url} passHref legacyBehavior>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={cn(
                      "hover:bg-secondary hover:text-secondary-foreground",
                      pathname === item.url && "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4 text-muted-foreground" />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
          }

          // Handle items with subitems
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || item.items?.some(subItem => pathname === subItem.url)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    className="hover:bg-secondary hover:text-secondary-foreground"
                  >
                    {item.icon && <item.icon className="h-4 w-4 text-muted-foreground" />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <Link href={subItem.url} passHref legacyBehavior>
                          <SidebarMenuSubButton
                            className={cn(
                              "hover:bg-secondary hover:text-secondary-foreground",
                              pathname === subItem.url && "bg-secondary text-secondary-foreground"
                            )}
                          >
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
