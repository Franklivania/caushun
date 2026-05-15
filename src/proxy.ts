import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user
  const role = session?.user?.role
  const isAdmin = role === "admin"
  // Admins skip onboarding entirely
  const isOnboardingComplete = session?.user?.onboardingComplete || isAdmin

  const isAppRoute = nextUrl.pathname.startsWith("/landlord") ||
    nextUrl.pathname.startsWith("/tenant") ||
    nextUrl.pathname.startsWith("/admin") ||
    nextUrl.pathname.startsWith("/escrow") ||
    nextUrl.pathname.startsWith("/settings")

  const isOnboardingRoute = nextUrl.pathname.startsWith("/onboarding")
  const isAuthRoute = nextUrl.pathname.startsWith("/auth")

  // Redirect unauthenticated users away from protected routes
  if (isAppRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth", nextUrl))
  }

  // Redirect incomplete users to onboarding (admins exempt)
  if (isAppRoute && isLoggedIn && !isOnboardingComplete) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl))
  }

  // Redirect completed users away from onboarding
  if (isOnboardingRoute && isLoggedIn && isOnboardingComplete) {
    if (role === "landlord") return NextResponse.redirect(new URL("/landlord", nextUrl))
    if (role === "tenant") return NextResponse.redirect(new URL("/tenant", nextUrl))
    if (isAdmin) return NextResponse.redirect(new URL("/admin", nextUrl))
    return NextResponse.redirect(new URL("/", nextUrl))
  }

  // Redirect logged-in + complete users away from auth page
  if (isAuthRoute && isLoggedIn && isOnboardingComplete) {
    if (role === "landlord") return NextResponse.redirect(new URL("/landlord", nextUrl))
    if (role === "tenant") return NextResponse.redirect(new URL("/tenant", nextUrl))
    if (isAdmin) return NextResponse.redirect(new URL("/admin", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
