import { type NextRequest, NextResponse } from "next/server"
import { scrapePropertiesRealTimeSimple } from "@/lib/real-time-scraper-simple"

export async function POST(request: NextRequest) {
  try {
    const criteria = await request.json()

    if (!criteria.neighborhoods || criteria.neighborhoods.length === 0) {
      return NextResponse.json({ error: "Selecciona al menos un barrio" }, { status: 400 })
    }

    console.log("🔍 REAL-ONLY scraping with criteria:", criteria)

    // Usar el scraper que SOLO devuelve datos reales
    const properties = await scrapePropertiesRealTimeSimple(criteria)

    // Si no hay propiedades reales, devolver mensaje claro
    if (properties.length === 0) {
      return NextResponse.json({
        success: true,
        properties: [],
        count: 0,
        criteria,
        scrapingMethod: "real-only",
        timestamp: new Date().toISOString(),
        message:
          "No se encontraron propiedades reales que coincidan con los criterios. Los sitios web pueden estar bloqueando el acceso o no hay propiedades disponibles en este momento.",
      })
    }

    return NextResponse.json({
      success: true,
      properties,
      count: properties.length,
      criteria,
      scrapingMethod: "real-only",
      timestamp: new Date().toISOString(),
      message: `Scraping completado: ${properties.length} propiedades REALES encontradas`,
    })
  } catch (error) {
    console.error("Error en scraping real:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        properties: [],
        count: 0,
        message: "Error al realizar scraping real. Los sitios web pueden estar bloqueando el acceso.",
      },
      { status: 500 },
    )
  }
}
