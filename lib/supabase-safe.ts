import { createClient } from "@supabase/supabase-js"

// Safe defaults to prevent build errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

// Check if we have real credentials
const hasValidCredentials = supabaseUrl !== "https://placeholder.supabase.co" && supabaseAnonKey !== "placeholder-key"

// Client for frontend (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

// Client for backend (without RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return hasValidCredentials
}

// Safe connection test
export async function testSupabaseConnection() {
  if (!hasValidCredentials) {
    return {
      success: false,
      message:
        "Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
    }
  }

  try {
    const { data, error } = await supabase.from("properties").select("count", { count: "exact", head: true })

    if (error) throw error

    return { success: true, message: "Supabase connection successful" }
  } catch (error) {
    console.error("Supabase connection error:", error)
    return {
      success: false,
      message: `Connection failed: ${error.message || "Unknown error"}`,
    }
  }
}
