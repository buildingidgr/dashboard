"use client"

import * as React from "react"
import { useState, useMemo, createContext, useContext, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Switch } from "@/components/ui/switch"
import { Sun, Moon, ArrowRight, Eclipse } from "lucide-react"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useSession, useUser } from '@clerk/nextjs'
import { getAccessToken, setAccessToken } from '@/lib/services/auth'
import { getMyProfessionalInfo } from '@/lib/services/profile'
import { OnboardingGuide } from "@/components/onboarding-guide"
import { exchangeClerkToken } from "@/lib/services/auth"
import Link from "next/link"

interface ClientLayoutProps {
  children: React.ReactNode
}

interface ThemeContextType {
  isDarkMode: boolean
  setIsDarkMode: (value: boolean) => void
}

interface PageTitleContextType {
  title: string
  description?: string
  setTitle: (title: string) => void
  setDescription: (description?: string) => void
}

interface ToastContextType {
  toast: ReturnType<typeof useToast>["toast"]
}

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  setIsDarkMode: () => {},
})

export const PageTitleContext = createContext<PageTitleContextType>({
  title: "",
  description: "",
  setTitle: () => {},
  setDescription: () => {},
})

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useTheme() {
  return useContext(ThemeContext)
}

export function usePageTitle() {
  return useContext(PageTitleContext)
}

export function useAppToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useAppToast must be used within a ToastProvider")
  }
  return context.toast
}

function ClientLayout({ children }: ClientLayoutProps) {
  const { toast } = useToast()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState<string>()
  const [hasProfessionalData, setHasProfessionalData] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, isLoaded: isSessionLoaded } = useSession()
  const { user, isLoaded: isUserLoaded } = useUser()

  // Check professional data
  useEffect(() => {
    const checkProfessionalData = async () => {
      try {
        await getMyProfessionalInfo()
        setHasProfessionalData(true)
      } catch (error) {
        setHasProfessionalData(false)
      }
    }
    checkProfessionalData()
  }, [])

  // Redirect from /editor to /documents when no document ID is present
  useEffect(() => {
    if (pathname === '/editor' && (!searchParams || !searchParams.get('id'))) {
      router.replace('/documents')
    }
  }, [pathname, searchParams, router])

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDarkMode = storedTheme === 'dark' || (!storedTheme && prefersDark)
    setIsDarkMode(initialDarkMode)
  }, [])

  // Apply theme class to root element and persist in localStorage
  useEffect(() => {
    const root = window.document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  // Handle token exchange on mount
  useEffect(() => {
    const exchangeToken = async () => {
      try {
        // Check if we already have a valid token
        const currentToken = getAccessToken();
        if (currentToken) {
          return; // Token exists and is valid (validation is handled in getAccessToken)
        }

        // Wait for both session and user to be loaded
        if (!isSessionLoaded || !isUserLoaded) {
          return;
        }

        if (!session?.id || !user?.id) {
          console.error('No session or user ID available', { 
            sessionId: session?.id, 
            userId: user?.id,
            isSessionLoaded,
            isUserLoaded
          })
          return
        }

        // Exchange the Clerk token with our auth service
        const response = await exchangeClerkToken(session.id, user.id)

        if (response?.access_token) {
          setAccessToken(response.access_token)
        } else {
          console.error('Failed to exchange token: No access token in response')
        }
      } catch (error) {
        console.error('Failed to exchange token:', error)
      }
    }

    exchangeToken()
  }, [session?.id, user?.id, isSessionLoaded, isUserLoaded])

  const breadcrumbs = useMemo(() => {
    if (!pathname) return []
    
    // Special case for editor route
    if (pathname.startsWith('/editor')) {
      const documentId = searchParams?.get('id') || 'Unknown'
      
      return [
        {
          href: '/documents',
          label: 'Documents',
          current: false
        },
        {
          href: '/editor',
          label: 'Editor',
          current: false
        },
        {
          href: `/editor?id=${documentId}`,
          label: documentId,
          current: true
        }
      ]
    }
    
    // Default breadcrumb generation for other routes
    const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean)
    
    return segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      return {
        href,
        label,
        current: index === segments.length - 1
      }
    })
  }, [pathname, searchParams])

  const themeValue = useMemo(() => ({
    isDarkMode,
    setIsDarkMode
  }), [isDarkMode])

  const pageTitleValue = useMemo(() => ({
    title,
    description,
    setTitle,
    setDescription
  }), [title, description])

  const toastValue = useMemo(() => ({ toast }), [toast])

  // Check if we're in the editor route
  const isEditorRoute = pathname?.startsWith('/editor')

  return (
    <ThemeContext.Provider value={themeValue}>
      <PageTitleContext.Provider value={pageTitleValue}>
        <ToastContext.Provider value={toastValue}>
          <div className={cn(isDarkMode ? "dark" : "light")}>
            <SidebarProvider>
              <AppSidebar className="shrink-0" />
              <SidebarInset className="flex flex-col">
                {/* Professional Data Alert */}
                {hasProfessionalData === false && (
                  <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-3">
                    <div className="flex flex-col justify-between gap-2 md:flex-row">
                      <div className="flex grow gap-3">
                        <Eclipse
                          className="mt-0.5 shrink-0 text-white dark:text-black opacity-60"
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        <div className="flex grow flex-col justify-between gap-2 md:flex-row md:items-center">
                          <p className="text-sm">
                            Complete your professional profile to get personalized opportunities and connect with the right professionals.
                          </p>
                          <Link 
                            href="/profile" 
                            className="group whitespace-nowrap text-sm font-medium text-white dark:text-black hover:text-gray-200 dark:hover:text-gray-700"
                          >
                            Update Profile
                            <ArrowRight
                              className="-mt-0.5 ms-1 inline-flex text-white dark:text-black opacity-60 transition-transform group-hover:translate-x-0.5"
                              size={16}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="flex items-center gap-4 px-4 w-full">
                    <SidebarTrigger className="-ml-2" />
                    <Separator orientation="vertical" className="h-6" />
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadcrumbLink 
                            href="/"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Home
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        {breadcrumbs.length > 0 && (
                          <BreadcrumbSeparator className="text-muted-foreground" />
                        )}
                        {breadcrumbs.map((crumb, index) => (
                          <React.Fragment key={crumb.href}>
                            <BreadcrumbItem>
                              {crumb.current ? (
                                <BreadcrumbPage className="text-foreground">
                                  {crumb.label}
                                </BreadcrumbPage>
                              ) : (
                                <BreadcrumbLink 
                                  href={crumb.href}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {crumb.label}
                                </BreadcrumbLink>
                              )}
                            </BreadcrumbItem>
                            {index < breadcrumbs.length - 1 && (
                              <BreadcrumbSeparator className="text-muted-foreground" />
                            )}
                          </React.Fragment>
                        ))}
                      </BreadcrumbList>
                    </Breadcrumb>

                    {!isEditorRoute && (
                      <div className="ml-auto flex items-center gap-2">
                        <OnboardingGuide />
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4 text-muted-foreground" />
                          <Switch
                            checked={isDarkMode}
                            onCheckedChange={setIsDarkMode}
                            className="data-[state=checked]:bg-foreground"
                          />
                          <Moon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </header>

                {isEditorRoute ? (
                  <div className="h-full">
                    {children}
                  </div>
                ) : (
                  <div className="flex-1 p-8">
                    {children}
                  </div>
                )}
              </SidebarInset>
            </SidebarProvider>
          </div>
          <Toaster />
        </ToastContext.Provider>
      </PageTitleContext.Provider>
    </ThemeContext.Provider>
  )
}

export default ClientLayout; 



