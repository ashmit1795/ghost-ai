import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher([
  "/editor(.*)",
])

export const proxy = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const { pathname } = req.nextUrl
  
  // Redirect root path directly in the proxy to avoid rendering and client-side routing hangs
  if (pathname === "/") {
    const targetUrl = new URL(userId ? "/editor" : "/sign-in", req.url)
    return NextResponse.redirect(targetUrl)
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  
  return NextResponse.next()
})

export default proxy

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
