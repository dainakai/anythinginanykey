import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    try {
      await supabase.auth.exchangeCodeForSession(code)
      // URL to redirect to after sign in process completes
      console.log("Successfully exchanged code for session, redirecting to /");
      return NextResponse.redirect(requestUrl.origin)
    } catch (error) {
      console.error("Error exchanging code for session:", error);
      // Handle error, maybe redirect to an error page
      const errorUrl = new URL('/login?error=auth_callback_failed', requestUrl.origin)
      return NextResponse.redirect(errorUrl)
    }
  }

  // URL to redirect to if code is not available
  console.error("No code found in callback URL");
  const errorUrl = new URL('/login?error=no_code_in_callback', requestUrl.origin)
  return NextResponse.redirect(errorUrl)
}
