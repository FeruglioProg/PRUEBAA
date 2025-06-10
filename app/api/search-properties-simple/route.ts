import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-simple"

export async function POST(request: NextRequest) {
  try {
    const criteria = await request.json()

    // Datos de ejemplo si Supabase falla
    const fallbackProperties = [
      {
        id: "example-1",
        title: "Departamento 2 ambientes en Palermo Hollywood",
        link: "https://www.zonaprop.com.ar/ejemplo-1",
        total_price: 180000,
        surface: 65,
        price_per_m2: 2769,
        source: "Zonaprop",
        neighborhood: "Palermo",
        is_owner: true,
        published_date: new Date().toISOString(),
      },
      {
        id: "example-2",
        title: "Monoambiente luminoso en Belgrano",
        link: "https://www.argenprop.com/ejemplo-2",
        total_price: 120000,
        surface: 45,
        price_per_m2: 2667,
        source: "Argenprop",
        neighborhood: "Belgrano",
        is_owner: false,
        published_date: new Date().toISOString(),
      },
      {
        id: "example-3",
        title: "Departamento de categoría en Recoleta",
        link: "https://inmuebles.mercadolibre.com.ar/ejemplo-3",
        total_price: 250000,
        surface: 85,
        price_per_m2: 2941,
        source: "MercadoLibre",
        neighborhood: "Recoleta",
        is_owner: true,
        published_date: new Date().toISOString(),
      },
    ]

    try {
      // Intentar obtener de Supabase
      const { data: properties } = await supabaseAdmin.from("properties").select("*").limit(10)

      if (properties && properties.length > 0) {
        return NextResponse.json({
          properties,
          count: properties.length,
          source: "supabase",
          timestamp: new Date().toISOString(),
        })
      }
    } catch (supabaseError) {
      console.log("Supabase not available, using fallback data")
    }

    // Usar datos de ejemplo
    return NextResponse.json({
      properties: fallbackProperties,
      count: fallbackProperties.length,
      source: "fallback",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Search failed", details: error.message }, { status: 500 })
  }
}
