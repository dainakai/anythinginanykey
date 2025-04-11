import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase' // Use path alias

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await request.cookies.get(name))?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        async remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refreshing the session helps keep the user signed in.
  // This will exchange the access token for a new one if it's expired.
  // Important!!! Must be called before accessing `getUser()`
  await supabase.auth.getUser() 

  return response
}
