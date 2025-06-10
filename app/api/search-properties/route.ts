import { type NextRequest, NextResponse } from "next/server"
import { scrapePropertiesSimplified } from "@/lib/simplified-scraper"

export async function POST(request: NextRequest) {
  try {
    const criteria = await request.json()

    // Validar criterios básicos
    if (!criteria.neighborhoods || criteria.neighborhoods.length === 0) {
      return NextResponse.json({ error: "Selecciona al menos un barrio" }, { status: 400 })
    }

    console.log("🔍 Starting property search with criteria:", criteria)

    // Usar el scraper simplificado que no depende de Redis ni métricas
    const properties = await scrapePropertiesSimplified(criteria)

    return NextResponse.json({
      success: true,
      properties,
      count: properties.length,
      criteria,
      scrapingMethod: properties.length > 0 ? "success" : "fallback",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en búsqueda:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al buscar propiedades",
        properties: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
