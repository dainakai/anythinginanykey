// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware' // Path is now correct
import { createServerClient } from '@supabase/ssr' // Need createServerClient for getUser check
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase' // Use path alias

export async function middleware(request: NextRequest) {
  // Update the session
  const response = await updateSession(request)

  // Check user authentication AFTER updating the session
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // Middleware shouldn't need to set cookies directly after updateSession
        // but keep stubs if needed for other logic.
        set(name: string, value: string, options) {
          // Ignored in middleware check after updateSession
        },
        remove(name: string, options) {
          // Ignored in middleware check after updateSession
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // If user is not signed in and the current path is not /login or API routes,
  // redirect the user to /login
  if (
    !user &&
    request.nextUrl.pathname !== '/login' &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    request.nextUrl.pathname !== '/favicon.ico'
  ) {
    // Allow access to root path '/' even if not logged in
    if (request.nextUrl.pathname !== '/') {
        const loginUrl = new URL('/login', request.url)
        console.log(`Redirecting unauthenticated user from ${request.nextUrl.pathname} to /login`);
        // Use NextResponse.redirect instead of returning updateSession's response directly
        return NextResponse.redirect(loginUrl)
    }
  }

  // If user is signed in and tries to access /login, redirect to dashboard (optional)
  // if (user && request.nextUrl.pathname === '/login') {
  //   return NextResponse.redirect(new URL('/dashboard', request.url))
  // }

  // Return the response from updateSession (contains updated cookies)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Removed explicit /api exclusion here as it's handled in the logic above
    // Removed explicit /login exclusion here as it's handled in the logic above
  ],
}
