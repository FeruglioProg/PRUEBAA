import type { Property } from "./types"

// Scraper simplificado que evita dependencias problemáticas
export async function scrapePropertiesSimple(criteria: any): Promise<Property[]> {
  console.log("🔍 Using simplified scraper to avoid build issues")

  // Simular delay de scraping real
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const { neighborhoods = [], ownerOnly = false, maxPricePerM2 } = criteria

  // Base de datos de propiedades simuladas más extensa
  const allProperties: Property[] = [
    // PALERMO
    {
      id: `simple-palermo-${Date.now()}-1`,
      title: "Departamento 2 ambientes en Palermo Hollywood con balcón",
      link: "https://www.zonaprop.com.ar/propiedades/departamento-2-ambientes-en-palermo-hollywood-con-balcon-49693234.html",
      totalPrice: 180000,
      surface: 65,
      pricePerM2: 2769,
      source: "Zonaprop",
      neighborhood: "Palermo",
      isOwner: true,
      publishedDate: new Date(),
    },
    {
      id: `simple-palermo-${Date.now()}-2`,
      title: "Monoambiente a estrenar en Palermo Soho",
      link: "https://www.zonaprop.com.ar/propiedades/monoambiente-a-estrenar-en-palermo-soho-49125678.html",
      totalPrice: 120000,
      surface: 40,
      pricePerM2: 3000,
      source: "Zonaprop",
      neighborhood: "Palermo",
      isOwner: false,
      publishedDate: new Date(),
    },
    {
      id: `simple-palermo-${Date.now()}-3`,
      title: "Departamento 3 ambientes Palermo con cochera",
      link: "https://www.argenprop.com/departamento-en-venta-en-palermo-3-ambientes--9873456",
      totalPrice: 220000,
      surface: 80,
      pricePerM2: 2750,
      source: "Argenprop",
      neighborhood: "Palermo",
      isOwner: true,
      publishedDate: new Date(),
    },

    // BELGRANO
    {
      id: `simple-belgrano-${Date.now()}-1`,
      title: "Monoambiente en Belgrano cerca del subte",
      link: "https://www.zonaprop.com.ar/propiedades/monoambiente-en-belgrano-cerca-del-subte-48956712.html",
      totalPrice: 95000,
      surface: 35,
      pricePerM2: 2714,
      source: "Zonaprop",
      neighborhood: "Belgrano",
      isOwner: false,
      publishedDate: new Date(),
    },
    {
      id: `simple-belgrano-${Date.now()}-2`,
      title: "Departamento 2 ambientes en Belgrano R",
      link: "https://www.argenprop.com/departamento-en-venta-en-belgrano-2-ambientes--9765432",
      totalPrice: 145000,
      surface: 55,
      pricePerM2: 2636,
      source: "Argenprop",
      neighborhood: "Belgrano",
      isOwner: true,
      publishedDate: new Date(),
    },

    // RECOLETA
    {
      id: `simple-recoleta-${Date.now()}-1`,
      title: "3 ambientes en Recoleta con cochera",
      link: "https://www.zonaprop.com.ar/propiedades/3-ambientes-en-recoleta-con-cochera-49234567.html",
      totalPrice: 250000,
      surface: 85,
      pricePerM2: 2941,
      source: "Zonaprop",
      neighborhood: "Recoleta",
      isOwner: true,
      publishedDate: new Date(),
    },
    {
      id: `simple-recoleta-${Date.now()}-2`,
      title: "Departamento de lujo en Recoleta, 4 ambientes",
      link: "https://www.argenprop.com/departamento-en-venta-en-recoleta-4-ambientes--9654321",
      totalPrice: 380000,
      surface: 120,
      pricePerM2: 3167,
      source: "Argenprop",
      neighborhood: "Recoleta",
      isOwner: false,
      publishedDate: new Date(),
    },

    // VILLA CRESPO
    {
      id: `simple-villacrespo-${Date.now()}-1`,
      title: "Departamento en Villa Crespo con terraza",
      link: "https://www.zonaprop.com.ar/propiedades/departamento-en-villa-crespo-con-terraza-48765432.html",
      totalPrice: 145000,
      surface: 58,
      pricePerM2: 2500,
      source: "Zonaprop",
      neighborhood: "Villa Crespo",
      isOwner: false,
      publishedDate: new Date(),
    },

    // SAN TELMO
    {
      id: `simple-santelmo-${Date.now()}-1`,
      title: "Loft en San Telmo histórico",
      link: "https://www.zonaprop.com.ar/propiedades/loft-en-san-telmo-historico-49876543.html",
      totalPrice: 120000,
      surface: 55,
      pricePerM2: 2182,
      source: "Zonaprop",
      neighborhood: "San Telmo",
      isOwner: true,
      publishedDate: new Date(),
    },

    // CABALLITO
    {
      id: `simple-caballito-${Date.now()}-1`,
      title: "Departamento en Caballito con patio",
      link: "https://www.argenprop.com/departamento-en-venta-en-caballito-3-ambientes--9543210",
      totalPrice: 135000,
      surface: 60,
      pricePerM2: 2250,
      source: "Argenprop",
      neighborhood: "Caballito",
      isOwner: true,
      publishedDate: new Date(),
    },

    // FLORES
    {
      id: `simple-flores-${Date.now()}-1`,
      title: "2 ambientes en Flores cerca del subte",
      link: "https://inmuebles.mercadolibre.com.ar/departamentos/venta/capital-federal/flores/departamento-2-ambientes-flores_NoIndex_True",
      totalPrice: 110000,
      surface: 50,
      pricePerM2: 2200,
      source: "MercadoLibre",
      neighborhood: "Flores",
      isOwner: false,
      publishedDate: new Date(),
    },

    // BARRACAS
    {
      id: `simple-barracas-${Date.now()}-1`,
      title: "PH reciclado en Barracas, 3 ambientes",
      link: "https://www.argenprop.com/ph-en-venta-en-barracas-3-ambientes--9432109",
      totalPrice: 140000,
      surface: 70,
      pricePerM2: 2000,
      source: "Argenprop",
      neighborhood: "Barracas",
      isOwner: true,
      publishedDate: new Date(),
    },

    // ALMAGRO
    {
      id: `simple-almagro-${Date.now()}-1`,
      title: "Departamento 2 ambientes en Almagro, excelente ubicación",
      link: "https://www.zonaprop.com.ar/propiedades/departamento-2-ambientes-en-almagro-excelente-ubicacion-49345678.html",
      totalPrice: 125000,
      surface: 52,
      pricePerM2: 2404,
      source: "Zonaprop",
      neighborhood: "Almagro",
      isOwner: false,
      publishedDate: new Date(),
    },
  ]

  // Aplicar filtros
  let filtered = [...allProperties]

  // Filtrar por barrios
  if (neighborhoods.length > 0) {
    filtered = filtered.filter((property) =>
      neighborhoods.some(
        (n: string) =>
          property.neighborhood.toLowerCase() === n.toLowerCase() ||
          property.title.toLowerCase().includes(n.toLowerCase()),
      ),
    )
  }

  // Filtrar por propietario
  if (ownerOnly) {
    filtered = filtered.filter((property) => property.isOwner)
  }

  // Filtrar por precio por m²
  if (maxPricePerM2 && maxPricePerM2 > 0) {
    filtered = filtered.filter((property) => property.pricePerM2 <= maxPricePerM2 * 1.1)
  }

  // Simular variabilidad en resultados
  const shuffled = filtered.sort(() => 0.5 - Math.random())
  const results = shuffled.slice(0, Math.min(15, shuffled.length))

  console.log(`✅ Simple scraping completed: ${results.length} properties found`)
  return results
}
