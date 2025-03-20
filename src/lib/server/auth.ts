import { createServerClient } from '@supabase/ssr'
import { parseCookies, setCookie } from '@tanstack/react-start/server'

// Make sure environment variables are defined
const supabaseUrl = process.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL')
if (!supabaseAnonKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY')

export function getSupabaseServerClient() {
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return Object.entries(parseCookies()).map(([name, value]) => ({
            name,
            value,
          }))
        },
        setAll(cookies: Array<{ name: string; value: string }>) {
          cookies.forEach((cookie) => {
            setCookie(cookie.name, cookie.value)
          })
        },
      },
    }
  )
}

export const auth = {
  signIn: async (email: string, password: string) => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signUp: async (email: string, password: string) => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getSession: async () => {
    const supabase = getSupabaseServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  getUser: async () => {
    const supabase = getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }
}
