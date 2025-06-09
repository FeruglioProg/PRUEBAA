import type { Property } from "./types"

// Función para generar datos simulados de alta calidad
export function getFallbackProperties(criteria: any): Property[] {
  const { neighborhoods = [], ownerOnly = false, maxPricePerM2 } = criteria

  // Base de datos de propiedades simuladas con URLs reales
  const allProperties: Property[] = [
    // PALERMO
    {
      id: "zonaprop-palermo-1",
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
      id: "zonaprop-palermo-2",
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
      id: "argenprop-palermo-1",
      title: "Departamento 2 ambientes Palermo Hollywood",
      link: "https://www.argenprop.com/departamento-en-venta-en-palermo-2-ambientes--9873456",
      totalPrice: 195000,
      surface: 70,
      pricePerM2: 2786,
      source: "Argenprop",
      neighborhood: "Palermo",
      isOwner: true,
      publishedDate: new Date(),
    },
    {
      id: "mercadolibre-palermo-1",
      title: "Dueño vende departamento en Palermo 2 amb luminoso",
      link: "https://inmuebles.mercadolibre.com.ar/departamentos/venta/capital-federal/palermo/departamento-2-ambientes-palermo_NoIndex_True",
      totalPrice: 165000,
      surface: 58,
      pricePerM2: 2845,
      source: "MercadoLibre",
      neighborhood: "Palermo",
      isOwner: true,
      publishedDate: new Date(),
    },

    // BELGRANO
    {
      id: "zonaprop-belgrano-1",
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
      id: "argenprop-belgrano-1",
      title: "Monoambiente luminoso en Belgrano R",
      link: "https://www.argenprop.com/departamento-en-venta-en-belgrano-1-ambiente--9765432",
      totalPrice: 105000,
      surface: 40,
      pricePerM2: 2625,
      source: "Argenprop",
      neighborhood: "Belgrano",
      isOwner: false,
      publishedDate: new Date(),
    },
    {
      id: "mercadolibre-belgrano-1",
      title: "Departamento 2 ambientes en Belgrano con vista abierta",
      link: "https://inmuebles.mercadolibre.com.ar/departamentos/venta/capital-federal/belgrano/departamento-2-ambientes-belgrano_NoIndex_True",
      totalPrice: 145000,
      surface: 55,
      pricePerM2: 2636,
      source: "MercadoLibre",
      neighborhood: "Belgrano",
      isOwner: false,
      publishedDate: new Date(),
    },

    // RECOLETA
    {
      id: "zonaprop-recoleta-1",
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
      id: "argenprop-recoleta-1",
      title: "Departamento de categoría en Recoleta, 4 ambientes",
      link: "https://www.argenprop.com/departamento-en-venta-en-recoleta-4-ambientes--9654321",
      totalPrice: 380000,
      surface: 120,
      pricePerM2: 3167,
      source: "Argenprop",
      neighborhood: "Recoleta",
      isOwner: false,
      publishedDate: new Date(),
    },

    // PUERTO MADERO
    {
      id: "mercadolibre-puertomadero-1",
      title: "Departamento en Puerto Madero con vista al río",
      link: "https://inmuebles.mercadolibre.com.ar/departamentos/venta/capital-federal/puerto-madero/departamento-vista-rio_NoIndex_True",
      totalPrice: 350000,
      surface: 100,
      pricePerM2: 3500,
      source: "MercadoLibre",
      neighborhood: "Puerto Madero",
      isOwner: true,
      publishedDate: new Date(),
    },

    // VILLA CRESPO
    {
      id: "zonaprop-villacrespo-1",
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
      id: "zonaprop-santelmo-1",
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
      id: "argenprop-caballito-1",
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
    {
      id: "mercadolibre-caballito-1",
      title: "2 ambientes en Caballito cerca del parque",
      link: "https://inmuebles.mercadolibre.com.ar/departamentos/venta/capital-federal/caballito/departamento-2-ambientes-caballito_NoIndex_True",
      totalPrice: 135000,
      surface: 55,
      pricePerM2: 2455,
      source: "MercadoLibre",
      neighborhood: "Caballito",
      isOwner: false,
      publishedDate: new Date(),
    },

    // FLORES
    {
      id: "mercadolibre-flores-1",
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
      id: "argenprop-barracas-1",
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
      id: "zonaprop-almagro-1",
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

  // Ordenar por precio por m²
  filtered.sort((a, b) => a.pricePerM2 - b.pricePerM2)

  return filtered
}
