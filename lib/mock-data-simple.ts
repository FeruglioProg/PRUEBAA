import type { Property } from "./types"

export function getSimpleProperties(criteria: any): Property[] {
  const { neighborhoods = [], ownerOnly = false, maxPricePerM2 } = criteria

  const allProperties: Property[] = [
    {
      id: "1",
      title: "Departamento 2 ambientes en Palermo Hollywood",
      link: "https://www.zonaprop.com.ar/ejemplo-1",
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
      link: "https://www.zonaprop.com.ar/ejemplo-2",
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
      link: "https://www.argenprop.com/ejemplo-3",
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
      link: "https://www.zonaprop.com.ar/ejemplo-4",
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
      link: "https://inmuebles.mercadolibre.com.ar/ejemplo-5",
      totalPrice: 120000,
      surface: 55,
      pricePerM2: 2182,
      source: "MercadoLibre",
      neighborhood: "San Telmo",
      isOwner: true,
      publishedDate: new Date(),
    },
  ]

  // Aplicar filtros
  let filtered = [...allProperties]

  if (neighborhoods.length > 0) {
    filtered = filtered.filter((property) =>
      neighborhoods.some((n: string) => property.neighborhood.toLowerCase() === n.toLowerCase()),
    )
  }

  if (ownerOnly) {
    filtered = filtered.filter((property) => property.isOwner)
  }

  if (maxPricePerM2 && maxPricePerM2 > 0) {
    filtered = filtered.filter((property) => property.pricePerM2 <= maxPricePerM2)
  }

  return filtered
}
