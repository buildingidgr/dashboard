import { authMiddleware } from "@clerk/nextjs"
import { NextResponse } from "next/server"

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: ["/login", "/sign-up", "/forgot-password", "/reset-password"],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: ["/api/public"],
  // Custom handling for API routes
  afterAuth(auth, req) {
    // Handle API routes differently
    if (req.nextUrl.pathname.startsWith('/api/')) {
      // Allow token exchange endpoint without Bearer token
      if (req.nextUrl.pathname === '/api/auth/exchange') {
        return NextResponse.next()
      }

      // Check for Bearer token in Authorization header
      const authHeader = req.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: "Bearer token required" }, { status: 401 })
      }

      // Allow the request to proceed if it has a Bearer token
      return NextResponse.next()
    }

    // For non-API routes, if user is not signed in and trying to access a protected route,
    // redirect them to the login page
    if (!auth.userId && !auth.isPublicRoute) {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }

    // Allow the request to proceed
    return NextResponse.next()
  }
})

// Configure matcher to handle all routes except static files and Next.js internals
export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)"
  ]
} 