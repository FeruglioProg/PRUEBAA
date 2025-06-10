import { createClient } from "@supabase/supabase-js"

// Make Supabase optional
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if we have the required environment variables
const hasSupabaseConfig = supabaseUrl && supabaseAnonKey

// Create clients only if configuration exists
export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null

export const supabaseAdmin =
  hasSupabaseConfig && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

// Helper function to check if Supabase is configured
export function isSupabaseConfigured() {
  return !!hasSupabaseConfig
}
