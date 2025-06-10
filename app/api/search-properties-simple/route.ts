import { type NextRequest, NextResponse } from "next/server"
import { realTimeScraperSimple } from "@/lib/real-time-scraper-simple"
import { saveSearchResults } from "@/lib/supabase-simple"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Starting simple property search...")

    const body = await request.json()
    const { neighborhoods, maxPrice, maxPricePerSqm, minSurface, maxSurface, neighborhoodPrices } = body

    console.log("Search parameters:", {
      neighborhoods: neighborhoods?.length || 0,
      maxPrice,
      maxPricePerSqm,
      minSurface,
      maxSurface,
      neighborhoodPrices: Object.keys(neighborhoodPrices || {}).length,
    })

    // Validate required parameters
    if (!neighborhoods || neighborhoods.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one neighborhood is required",
          properties: [],
        },
        { status: 400 },
      )
    }

    // Start scraping
    const startTime = Date.now()
    const results = await realTimeScraperSimple.scrapeProperties({
      neighborhoods,
      maxPrice,
      maxPricePerSqm,
      minSurface,
      maxSurface,
      neighborhoodPrices: neighborhoodPrices || {},
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`✅ Search completed in ${duration}ms`)
    console.log(`📊 Found ${results.length} properties`)

    // Save results to Supabase (optional)
    try {
      await saveSearchResults(body, results)
    } catch (error) {
      console.warn("Failed to save to Supabase:", error)
      // Continue without failing the request
    }

    return NextResponse.json({
      success: true,
      properties: results,
      metadata: {
        searchTime: duration,
        totalFound: results.length,
        searchParams: {
          neighborhoods: neighborhoods.length,
          hasMaxPrice: !!maxPrice,
          hasMaxPricePerSqm: !!maxPricePerSqm,
          hasSurfaceFilters: !!(minSurface || maxSurface),
          hasNeighborhoodPrices: Object.keys(neighborhoodPrices || {}).length > 0,
        },
      },
    })
  } catch (error) {
    console.error("❌ Search properties error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        properties: [],
        metadata: {
          searchTime: 0,
          totalFound: 0,
          errorDetails: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Property search API endpoint",
    methods: ["POST"],
    requiredParams: ["neighborhoods"],
    optionalParams: ["maxPrice", "maxPricePerSqm", "minSurface", "maxSurface", "neighborhoodPrices"],
  })
}
