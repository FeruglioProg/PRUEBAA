import { type NextRequest, NextResponse } from "next/server"
import { scrapePropertiesAdvanced } from "@/lib/advanced-scraper"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing real scraping...")

    const criteria = await request.json()

    // Test con timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Scraping timeout after 60 seconds")), 60000),
    )

    const scrapingPromise = scrapePropertiesAdvanced(criteria)

    const properties = (await Promise.race([scrapingPromise, timeoutPromise])) as any[]

    return NextResponse.json({
      success: true,
      properties,
      count: properties.length,
      timestamp: new Date().toISOString(),
      message: "Real scraping test completed successfully",
      criteria,
    })
  } catch (error) {
    console.error("🚨 Real scraping test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        message: "Real scraping test failed",
      },
      { status: 500 },
    )
  }
}
