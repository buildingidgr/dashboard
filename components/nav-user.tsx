"use client"

import { useUser, useClerk } from "@clerk/nextjs"
import { ChevronsUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { clearTokens } from "@/lib/services/auth"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useToast } from "@/hooks/use-toast"

export function NavUser() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { toast } = useToast()

  if (!user) {
    return null
  }

  const userData = {
    name: user.fullName || 'Anonymous',
    email: user.primaryEmailAddress?.emailAddress || '',
    avatar: user.imageUrl,
  }

  const handleSignOut = async () => {
    try {
      // Clear any stored tokens or session data
      clearTokens()
      
      // Sign out from Clerk
      await signOut()
      
      // Redirect to login page
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again."
      })
    }
  }

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
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="rounded-lg">
                  {userData.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">{userData.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {userData.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback className="rounded-lg">
                    {userData.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">{userData.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userData.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="hover:bg-secondary hover:text-secondary-foreground"
              onClick={() => router.push('/profile')}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="hover:bg-secondary hover:text-secondary-foreground"
              onClick={() => router.push('/profile?tab=preferences')}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="hover:bg-secondary hover:text-secondary-foreground"
              onClick={handleSignOut}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
