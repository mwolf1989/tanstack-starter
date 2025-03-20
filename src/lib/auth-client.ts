import { createBrowserClient } from '@supabase/ssr'

if (!import.meta.env.VITE_SUPABASE_URL) throw new Error('Missing VITE_SUPABASE_URL')
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) throw new Error('Missing VITE_SUPABASE_ANON_KEY')

const supabaseClient = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default supabaseClient
