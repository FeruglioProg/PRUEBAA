import { createClient } from "@supabase/supabase-js"

// Configuración simplificada de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zoolzzlufzoosgdlpkfh.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvb2x6emx1Znpvb3NnZGxwa2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDg5MzUsImV4cCI6MjA2NTA4NDkzNX0.S3iw3XzB1ulJ5qZD_10CTiFaE7SU96oHnMjXvysWrmE"
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvb2x6emx1Znpvb3NnZGxwa2ZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUwODkzNSwiZXhwIjoyMDY1MDg0OTM1fQ.Gnhl7fBuS4-gEq6lvQKn2dcKWKOIuoQBb3NlKHLlnSo"

// Cliente para el frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para el backend
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
