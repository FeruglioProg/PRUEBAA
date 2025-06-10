export interface Property {
  id: string
  title: string
  link: string
  totalPrice: number
  surface: number
  pricePerM2: number
  source: string
  neighborhood: string
  isOwner: boolean
  publishedDate: Date
}

// Base de datos en memoria (sin Prisma)
const properties: Property[] = [
  {
    id: "1",
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
    id: "2",
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
    id: "3",
    title: "3 ambientes en Recoleta con cochera",
    link: "https://www.zonaprop.com.ar/propiedades/3-ambientes-en-recoleta-con-cochera-49234567.html",
    totalPrice: 250000,
    surface: 85,
    pricePerM2: 2941,
    source: "Argenprop",
    neighborhood: "Recoleta",
    isOwner: true,
    publishedDate: new Date(),
  },
  {
    id: "4",
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
  {
    id: "5",
    title: "Loft en San Telmo histórico",
    link: "https://www.zonaprop.com.ar/propiedades/loft-en-san-telmo-historico-49876543.html",
    totalPrice: 120000,
    surface: 55,
    pricePerM2: 2182,
    source: "MercadoLibre",
    neighborhood: "San Telmo",
    isOwner: true,
    publishedDate: new Date(),
  },
  {
    id: "6",
    title: "Departamento 2 ambientes en Almagro",
    link: "https://www.argenprop.com/departamento-en-venta-en-almagro-2-ambientes--9345678",
    totalPrice: 125000,
    surface: 52,
    pricePerM2: 2404,
    source: "Argenprop",
    neighborhood: "Almagro",
    isOwner: false,
    publishedDate: new Date(),
  },
  {
    id: "7",
    title: "Monoambiente luminoso en Caballito",
    link: "https://inmuebles.mercadolibre.com.ar/departamentos/venta/capital-federal/caballito/monoambiente-caballito",
    totalPrice: 110000,
    surface: 42,
    pricePerM2: 2619,
    source: "MercadoLibre",
    neighborhood: "Caballito",
    isOwner: true,
    publishedDate: new Date(),
  },
  {
    id: "8",
    title: "PH en Barracas con patio",
    link: "https://www.zonaprop.com.ar/propiedades/ph-en-barracas-con-patio-48123456.html",
    totalPrice: 140000,
    surface: 70,
    pricePerM2: 2000,
    source: "Zonaprop",
    neighborhood: "Barracas",
    isOwner: true,
    publishedDate: new Date(),
  },
]

export function searchProperties(criteria: any): Property[] {
  const { neighborhoods = [], ownerOnly = false, maxPricePerM2 } = criteria

  let filtered = [...properties]

  // Filtrar por barrios
  if (neighborhoods.length > 0) {
    filtered = filtered.filter((property) =>
      neighborhoods.some((n: string) => property.neighborhood.toLowerCase() === n.toLowerCase()),
    )
  }

  // Filtrar por propietario
  if (ownerOnly) {
    filtered = filtered.filter((property) => property.isOwner)
  }

  // Filtrar por precio por m²
  if (maxPricePerM2 && maxPricePerM2 > 0) {
    filtered = filtered.filter((property) => property.pricePerM2 <= maxPricePerM2)
  }

  // Ordenar por precio por m²
  filtered.sort((a, b) => a.pricePerM2 - b.pricePerM2)

  return filtered
}
