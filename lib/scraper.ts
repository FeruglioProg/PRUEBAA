import { scrapePropertiesAdvanced } from "./advanced-scraper"
import { getFallbackProperties } from "./mock-data"
import type { Property } from "./types"

// Función principal de scraping que intenta scraping real y cae en fallback si falla
export async function scrapeProperties(criteria: any): Promise<Property[]> {
  console.log("🚀 Starting property scraping with criteria:", criteria)

  try {
    // Intentar scraping real
    console.log("🔍 Attempting real scraping...")

    // Configurar timeout para evitar que el scraping tome demasiado tiempo
    const timeoutPromise = new Promise<Property[]>((_, reject) =>
      setTimeout(() => reject(new Error("Scraping timeout after 2 minutes")), 120000),
    )

    // Ejecutar scraping real con timeout
    const properties = await Promise.race([scrapePropertiesAdvanced(criteria), timeoutPromise])

    if (properties.length > 0) {
      console.log(`✅ Real scraping successful: ${properties.length} properties found`)
      return properties
    } else {
      console.log("⚠️ No properties found with real scraping, falling back to mock data")
      return getFallbackProperties(criteria)
    }
  } catch (error) {
    console.error("❌ Real scraping failed:", error)
    console.log("⚠️ Falling back to mock data")

    // En caso de error, devolver datos simulados
    return getFallbackProperties(criteria)
  }
}
