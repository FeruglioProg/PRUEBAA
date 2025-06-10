import { type NextRequest, NextResponse } from "next/server"
import { scrapeAllSites } from "@/lib/simple-scraper"
import { sendPropertyEmail } from "@/lib/email-simple"

export async function POST(request: NextRequest) {
  try {
    const criteria = await request.json()

    console.log("🔍 Starting real property search...")

    // Validaciones
    if (!criteria.neighborhoods || criteria.neighborhoods.length === 0) {
      return NextResponse.json({ error: "Selecciona al menos un barrio" }, { status: 400 })
    }

    // Realizar scraping real
    const properties = await scrapeAllSites(criteria)

    // Enviar email si se proporcionó
    if (criteria.email && properties.length > 0) {
      try {
        await sendPropertyEmail(criteria.email, properties, criteria)
      } catch (emailError) {
        console.error("Email failed:", emailError)
        // No fallar la búsqueda si el email falla
      }
    }

    return NextResponse.json({
      success: true,
      properties,
      count: properties.length,
      message: `Se encontraron ${properties.length} propiedades`,
      timestamp: new Date().toISOString(),
      source: "real-scraping",
    })
  } catch (error) {
    console.error("❌ Real search failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Error en la búsqueda",
        details: error.message,
        properties: [],
        count: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
