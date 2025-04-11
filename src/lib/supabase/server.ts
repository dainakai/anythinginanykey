import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export const createSupabaseServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

// For Route Handlers, you might need a separate function or adjust this one
// based on how you access cookies in your Route Handlers.
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const createSupabaseRouteHandlerClient = () => {
  const cookieStore = cookies()
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore })
}
