import { type NextRequest, NextResponse } from "next/server"
import { scrapePropertiesWithSupabase, getPropertiesFromSupabase } from "@/lib/scraper-supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("API: Received search request")

    const criteria = await request.json()
    console.log("API: Parsed criteria:", criteria)

    // Validate required fields
    if (!criteria.neighborhoods || criteria.neighborhoods.length === 0) {
      console.log("API: No neighborhoods selected")
      return NextResponse.json({ error: "At least one neighborhood must be selected" }, { status: 400 })
    }

    if (!criteria.timeRange) {
      console.log("API: No time range selected")
      return NextResponse.json({ error: "Time range is required" }, { status: 400 })
    }

    console.log("API: Starting property search with Supabase...")

    // Primero intentar obtener propiedades existentes
    let properties = await getPropertiesFromSupabase(criteria)

    // Si no hay suficientes propiedades, hacer scraping
    if (properties.length < 5) {
      console.log("API: Not enough existing properties, starting scraping...")
      const scrapedProperties = await scrapePropertiesWithSupabase(criteria)

      // Combinar resultados existentes con nuevos
      const allPropertyIds = new Set(properties.map((p) => p.id))
      const newProperties = scrapedProperties.filter((p) => !allPropertyIds.has(p.id))
      properties = [...properties, ...newProperties]
    }

    console.log(`API: Found ${properties.length} properties`)

    return NextResponse.json({
      properties,
      count: properties.length,
      criteria,
      timestamp: new Date().toISOString(),
      source: "supabase",
    })
  } catch (error) {
    console.error("API: Search error:", error)

    return NextResponse.json(
      {
        error: "Failed to search properties",
        details: error instanceof Error ? error.message : "Unknown error",
        properties: [],
        count: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
