import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente para el frontend (con RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para el backend (sin RLS, para operaciones administrativas)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
