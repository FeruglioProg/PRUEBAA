import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Using fallback mode.")
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export async function saveSearchResults(searchParams: any, results: any[]) {
  if (!supabase) {
    console.log("Supabase not configured, skipping save")
    return { success: false, message: "Supabase not configured" }
  }

  try {
    const { data, error } = await supabase.from("search_results").insert({
      search_params: searchParams,
      results: results,
      result_count: results.length,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving to Supabase:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error saving search results:", error)
    return { success: false, error: error.message }
  }
}

export async function getSearchHistory(limit = 10) {
  if (!supabase) {
    return { success: false, message: "Supabase not configured" }
  }

  try {
    const { data, error } = await supabase
      .from("search_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching search history:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching search history:", error)
    return { success: false, error: error.message }
  }
}
