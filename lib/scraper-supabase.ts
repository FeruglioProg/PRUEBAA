import { supabaseAdmin } from "./supabase"
import type { Property } from "./types"

// Simulador de scraping avanzado con datos realistas
export async function scrapePropertiesWithSupabase(criteria: any): Promise<Property[]> {
  console.log("🔍 Starting Supabase-powered scraping with criteria:", criteria)

  try {
    // Crear trabajo de scraping en Supabase
    const { data: job, error: jobError } = await supabaseAdmin
      .from("scraping_jobs")
      .insert({
        status: "processing",
        criteria,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (jobError) {
      console.error("Error creating scraping job:", jobError)
      throw jobError
    }

    console.log(`📝 Created scraping job: ${job.id}`)

    // Simular tiempo de scraping
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

    // Generar propiedades basadas en criterios
    const properties = await generateRealisticProperties(criteria)

    // Guardar propiedades en Supabase
    const savedProperties = []
    for (const property of properties) {
      const { data, error } = await supabaseAdmin
        .from("properties")
        .upsert(property, { onConflict: "id" })
        .select()
        .single()

      if (!error && data) {
        savedProperties.push(data)
      }
    }

    // Actualizar trabajo como completado
    await supabaseAdmin
      .from("scraping_jobs")
      .update({
        status: "completed",
        result: { properties: savedProperties.map((p) => p.id) },
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id)

    console.log(`✅ Scraping completed: ${savedProperties.length} properties saved`)
    return savedProperties
  } catch (error) {
    console.error("❌ Scraping failed:", error)
    throw error
  }
}

async function generateRealisticProperties(criteria: any): Promise<Property[]> {
  const { neighborhoods = [], owner_only = false, max_price_per_m2 } = criteria

  // Base de datos extensa de propiedades simuladas
  const propertyTemplates = [
    // PALERMO
    {
      title: "Departamento 2 ambientes en Palermo Hollywood con balcón",
      link: "https://www.zonaprop.com.ar/propiedades/departamento-2-ambientes-en-palermo-hollywood-con-balcon-49693234.html",
      total_price: 180000,
      surface: 65,
      source: "Zonaprop",
      neighborhood: "Palermo",
      is_owner: true,
    },
    {
      title: "Monoambiente a estrenar en Palermo Soho",
      link: "https://www.zonaprop.com.ar/propiedades/monoambiente-a-estrenar-en-palermo-soho-49125678.html",
      total_price: 120000,
      surface: 40,
      source: "Zonaprop",
      neighborhood: "Palermo",
      is_owner: false,
    },
    {
      title: "Departamento 3 ambientes Palermo con cochera",
      link: "https://www.argenprop.com/departamento-en-venta-en-palermo-3-ambientes--9873456",
      total_price: 220000,
      surface: 80,
      source: "Argenprop",
      neighborhood: "Palermo",
      is_owner: true,
    },

    // BELGRANO
    {
      title: "Monoambiente en Belgrano cerca del subte",
      link: "https://www.zonaprop.com.ar/propiedades/monoambiente-en-belgrano-cerca-del-subte-48956712.html",
      total_price: 95000,
      surface: 35,
      source: "Zonaprop",
      neighborhood: "Belgrano",
      is_owner: false,
    },
    {
      title: "Departamento 2 ambientes en Belgrano R",
      link: "https://www.argenprop.com/departamento-en-venta-en-belgrano-2-ambientes--9765432",
      total_price: 145000,
      surface: 55,
      source: "Argenprop",
      neighborhood: "Belgrano",
      is_owner: true,
    },

    // RECOLETA
    {
      title: "3 ambientes en Recoleta con cochera",
      link: "https://www.zonaprop.com.ar/propiedades/3-ambientes-en-recoleta-con-cochera-49234567.html",
      total_price: 250000,
      surface: 85,
      source: "Zonaprop",
      neighborhood: "Recoleta",
      is_owner: true,
    },
    {
      title: "Departamento de lujo en Recoleta, 4 ambientes",
      link: "https://www.argenprop.com/departamento-en-venta-en-recoleta-4-ambientes--9654321",
      total_price: 380000,
      surface: 120,
      source: "Argenprop",
      neighborhood: "Recoleta",
      is_owner: false,
    },

    // VILLA CRESPO
    {
      title: "Departamento en Villa Crespo con terraza",
      link: "https://www.zonaprop.com.ar/propiedades/departamento-en-villa-crespo-con-terraza-48765432.html",
      total_price: 145000,
      surface: 58,
      source: "Zonaprop",
      neighborhood: "Villa Crespo",
      is_owner: false,
    },

    // SAN TELMO
    {
      title: "Loft en San Telmo histórico",
      link: "https://www.zonaprop.com.ar/propiedades/loft-en-san-telmo-historico-49876543.html",
      total_price: 120000,
      surface: 55,
      source: "Zonaprop",
      neighborhood: "San Telmo",
      is_owner: true,
    },

    // CABALLITO
    {
      title: "Departamento en Caballito con patio",
      link: "https://www.argenprop.com/departamento-en-venta-en-caballito-3-ambientes--9543210",
      total_price: 135000,
      surface: 60,
      source: "Argenprop",
      neighborhood: "Caballito",
      is_owner: true,
    },

    // FLORES
    {
      title: "2 ambientes en Flores cerca del subte",
      link: "https://inmuebles.mercadolibre.com.ar/departamentos/venta/capital-federal/flores/departamento-2-ambientes-flores_NoIndex_True",
      total_price: 110000,
      surface: 50,
      source: "MercadoLibre",
      neighborhood: "Flores",
      is_owner: false,
    },

    // BARRACAS
    {
      title: "PH reciclado en Barracas, 3 ambientes",
      link: "https://www.argenprop.com/ph-en-venta-en-barracas-3-ambientes--9432109",
      total_price: 140000,
      surface: 70,
      source: "Argenprop",
      neighborhood: "Barracas",
      is_owner: true,
    },

    // ALMAGRO
    {
      title: "Departamento 2 ambientes en Almagro, excelente ubicación",
      link: "https://www.zonaprop.com.ar/propiedades/departamento-2-ambientes-en-almagro-excelente-ubicacion-49345678.html",
      total_price: 125000,
      surface: 52,
      source: "Zonaprop",
      neighborhood: "Almagro",
      is_owner: false,
    },
  ]

  // Filtrar por barrios
  let filtered = propertyTemplates
  if (neighborhoods.length > 0) {
    filtered = propertyTemplates.filter((property) =>
      neighborhoods.some((n) => property.neighborhood.toLowerCase() === n.toLowerCase()),
    )
  }

  // Filtrar por propietario
  if (owner_only) {
    filtered = filtered.filter((property) => property.is_owner)
  }

  // Generar propiedades con IDs únicos y variaciones
  const properties: Property[] = []

  for (let i = 0; i < Math.min(filtered.length, 15); i++) {
    const template = filtered[i]

    // Añadir variación en precios (±10%)
    const priceVariation = 0.9 + Math.random() * 0.2
    const total_price = Math.round(template.total_price * priceVariation)
    const price_per_m2 = Math.round(total_price / template.surface)

    // Filtrar por precio por m² si se especifica
    if (max_price_per_m2 && price_per_m2 > max_price_per_m2 * 1.1) {
      continue
    }

    const property: Property = {
      id: `supabase-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      title: template.title,
      link: template.link,
      total_price,
      surface: template.surface,
      price_per_m2,
      source: template.source as any,
      neighborhood: template.neighborhood,
      is_owner: template.is_owner,
      published_date: new Date().toISOString(),
    }

    properties.push(property)
  }

  return properties
}

// Función para obtener propiedades desde Supabase con filtros
export async function getPropertiesFromSupabase(criteria: any): Promise<Property[]> {
  try {
    let query = supabaseAdmin.from("properties").select("*").order("created_at", { ascending: false })

    // Aplicar filtros
    if (criteria.neighborhoods && criteria.neighborhoods.length > 0) {
      query = query.in("neighborhood", criteria.neighborhoods)
    }

    if (criteria.owner_only) {
      query = query.eq("is_owner", true)
    }

    if (criteria.max_price_per_m2) {
      query = query.lte("price_per_m2", criteria.max_price_per_m2 * 1.1)
    }

    // Filtrar por fecha si se especifica
    if (criteria.time_range && criteria.time_range !== "custom") {
      const now = new Date()
      const startDate = new Date()

      switch (criteria.time_range) {
        case "24h":
          startDate.setDate(now.getDate() - 1)
          break
        case "3d":
          startDate.setDate(now.getDate() - 3)
          break
        case "7d":
          startDate.setDate(now.getDate() - 7)
          break
      }

      query = query.gte("published_date", startDate.toISOString())
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.error("Error fetching properties:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getPropertiesFromSupabase:", error)
    return []
  }
}
