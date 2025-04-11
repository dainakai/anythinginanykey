import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase' // Use path alias

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
