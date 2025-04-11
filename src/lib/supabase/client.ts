import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// Renamed for clarity, but functionally the same for client-side
export const createSupabaseBrowserClient = () => createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Export a singleton instance for easier use in components
export const supabase = createSupabaseBrowserClient();
