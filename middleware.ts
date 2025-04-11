// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase' // Assuming you have types defined

export async function middleware(req: NextRequest) {
  // We need to create a response and hand it to the supabase client to be able to modify the response headers.
  const res = NextResponse.next()
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const { data: { session } } = await supabase.auth.getSession()

  // If user is not signed in and the current path is not /login, redirect the user to /login
  if (!session && req.nextUrl.pathname !== '/login' && !req.nextUrl.pathname.startsWith('/api')) {
    // Exclude specific public paths if needed, e.g., the root path '/' for landing page
    if (req.nextUrl.pathname !== '/') {
      const loginUrl = new URL('/login', req.url)
      console.log(`Redirecting unauthenticated user from ${req.nextUrl.pathname} to /login`);
      return NextResponse.redirect(loginUrl)
    }
  }

  // If user is signed in and the current path is /login, redirect the user to dashboard or home
  // Optional: Add redirection for authenticated users trying to access /login
  // if (session && req.nextUrl.pathname === '/login') {
  //   const dashboardUrl = new URL('/dashboard', req.url)
  //   return NextResponse.redirect(dashboardUrl)
  // }

  // IMPORTANT: You must return the Supabase response
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the login page itself)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
    // Include root path '/' if it should be handled by the middleware,
    // adjust the logic inside the middleware to allow unauthenticated access if needed.
    '/',
  ],
}
