import type { Page } from "puppeteer"
import { browserManager } from "./browser-manager"
import type { Property } from "./types"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function scrapePropertiesRealTime(criteria: any): Promise<Property[]> {
  console.log("🔍 Starting REAL-TIME property scraping with criteria:", criteria)

  const allProperties: Property[] = []

  // Ejecutar scrapers en paralelo para obtener resultados más rápido
  const scrapingPromises = [
    scrapeZonapropRealTime(criteria).catch((error) => {
      console.error("Zonaprop failed:", error.message)
      return []
    }),
    scrapeArgenpropRealTime(criteria).catch((error) => {
      console.error("Argenprop failed:", error.message)
      return []
    }),
    scrapeMercadoLibreRealTime(criteria).catch((error) => {
      console.error("MercadoLibre failed:", error.message)
      return []
    }),
  ]

  // Esperar a que todos los scrapers terminen
  const results = await Promise.all(scrapingPromises)

  // Combinar todos los resultados
  for (const properties of results) {
    allProperties.push(...properties)
  }

  console.log(`📊 Total properties scraped: ${allProperties.length}`)
  return applyRealTimeFilters(allProperties, criteria)
}

async function scrapeZonapropRealTime(criteria: any): Promise<Property[]> {
  const properties: Property[] = []
  let page: Page | null = null

  try {
    page = await browserManager.getPage()
    console.log("🏠 Starting Zonaprop real-time scraping...")

    // Construir URL de búsqueda real
    let searchUrl = "https://www.zonaprop.com.ar/departamentos-venta-capital-federal.html"

    // Si hay barrios específicos, construir URL más específica
    if (criteria.neighborhoods?.length > 0) {
      const neighborhoodMap: { [key: string]: string } = {
        Palermo: "palermo",
        Belgrano: "belgrano",
        Recoleta: "recoleta",
        "Puerto Madero": "puerto-madero",
        "San Telmo": "san-telmo",
        "Villa Crespo": "villa-crespo",
        Caballito: "caballito",
        Flores: "flores",
        Almagro: "almagro",
        Barracas: "barracas",
      }

      const firstNeighborhood = neighborhoodMap[criteria.neighborhoods[0]]
      if (firstNeighborhood) {
        searchUrl = `https://www.zonaprop.com.ar/departamentos-venta-${firstNeighborhood}.html`
      }
    }

    console.log("🔗 Zonaprop URL:", searchUrl)

    // Navegar a la página
    await page.goto(searchUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    })

    // Esperar a que carguen las propiedades
    await page.waitForSelector(".posting-card, .postingCard, .posting-container", {
      timeout: 30000,
    })

    // Scroll para cargar más contenido
    await autoScrollPage(page)

    // Extraer propiedades reales
    const propertyElements = await page.$$(".posting-card, .postingCard, .posting-container")
    console.log(`📋 Found ${propertyElements.length} property elements on Zonaprop`)

    for (let i = 0; i < Math.min(propertyElements.length, 10); i++) {
      try {
        const element = propertyElements[i]

        // Extraer datos de cada propiedad
        const propertyData = await page.evaluate((el) => {
          // Título
          const titleEl = el.querySelector(".posting-title, .postingCard-title, h2, h3")
          const title = titleEl?.textContent?.trim() || ""

          // Link
          const linkEl = el.querySelector('a[href*="/propiedades/"], a.posting-link, a.go-to-posting')
          let link = linkEl?.getAttribute("href") || ""
          if (link && !link.startsWith("http")) {
            link = `https://www.zonaprop.com.ar${link}`
          }

          // Precio
          const priceEl = el.querySelector(".posting-price, .postingCard-price, .price")
          const priceText = priceEl?.textContent?.trim() || ""

          // Características
          const featuresEl = el.querySelector(".posting-features, .postingCard-features, .features")
          const featuresText = featuresEl?.textContent?.trim() || ""

          return {
            title,
            link,
            priceText,
            featuresText,
            fullText: el.textContent?.trim() || "",
          }
        }, element)

        if (propertyData.title && propertyData.link) {
          // Procesar precio
          const priceMatch = propertyData.priceText.match(/USD\s*([\d.,]+)|U\$S\s*([\d.,]+)|\$\s*([\d.,]+)/i)
          let totalPrice = 0
          if (priceMatch) {
            const priceStr = (priceMatch[1] || priceMatch[2] || priceMatch[3] || "").replace(/[.,]/g, "")
            totalPrice = Number.parseInt(priceStr, 10) || 0
          }

          // Procesar superficie
          const surfaceMatch = propertyData.featuresText.match(/(\d+)\s*m²/i)
          const surface = surfaceMatch ? Number.parseInt(surfaceMatch[1], 10) : 50 // Default 50m²

          // Calcular precio por m²
          const pricePerM2 = surface > 0 ? Math.round(totalPrice / surface) : 0

          // Determinar si es dueño directo
          const isOwner =
            propertyData.fullText.toLowerCase().includes("dueño") ||
            propertyData.fullText.toLowerCase().includes("directo")

          // Extraer barrio
          const neighborhood = extractNeighborhoodFromText(propertyData.title, criteria.neighborhoods || [])

          if (totalPrice > 0 && pricePerM2 > 0) {
            properties.push({
              id: `zonaprop-real-${Date.now()}-${i}`,
              title: propertyData.title,
              link: propertyData.link,
              totalPrice,
              surface,
              pricePerM2,
              source: "Zonaprop",
              neighborhood,
              isOwner,
              publishedDate: new Date(),
            })
          }
        }
      } catch (error) {
        console.error(`Error processing Zonaprop property ${i}:`, error)
      }
    }

    console.log(`✅ Zonaprop: ${properties.length} real properties extracted`)
    return properties
  } catch (error) {
    console.error("❌ Zonaprop real-time scraping error:", error)
    return []
  }
}

async function scrapeArgenpropRealTime(criteria: any): Promise<Property[]> {
  const properties: Property[] = []
  let page: Page | null = null

  try {
    page = await browserManager.getPage()
    console.log("🏠 Starting Argenprop real-time scraping...")

    // URL base de Argenprop
    let searchUrl = "https://www.argenprop.com/departamento-venta-localidad-capital-federal"

    if (criteria.neighborhoods?.length > 0) {
      const neighborhood = criteria.neighborhoods[0].toLowerCase().replace(/\s+/g, "-")
      searchUrl = `https://www.argenprop.com/departamento-venta-localidad-capital-federal-barrio-${neighborhood}`
    }

    console.log("🔗 Argenprop URL:", searchUrl)

    await page.goto(searchUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    })

    // Esperar a que carguen las propiedades
    await page.waitForSelector(".listing-item, .card-property, .property-item", {
      timeout: 30000,
    })

    await autoScrollPage(page)

    // Extraer propiedades reales
    const propertyElements = await page.$$(".listing-item, .card-property, .property-item")
    console.log(`📋 Found ${propertyElements.length} property elements on Argenprop`)

    for (let i = 0; i < Math.min(propertyElements.length, 8); i++) {
      try {
        const element = propertyElements[i]

        const propertyData = await page.evaluate((el) => {
          // Título y link
          const titleLinkEl = el.querySelector('.title a, h2 a, h3 a, a[href*="/departamento-"]')
          const title = titleLinkEl?.textContent?.trim() || ""
          let link = titleLinkEl?.getAttribute("href") || ""
          if (link && !link.startsWith("http")) {
            link = `https://www.argenprop.com${link}`
          }

          // Precio
          const priceEl = el.querySelector(".price, .price-items, .price-container")
          const priceText = priceEl?.textContent?.trim() || ""

          // Características
          const featuresEl = el.querySelector(".features, .main-features, .property-features")
          const featuresText = featuresEl?.textContent?.trim() || ""

          return {
            title,
            link,
            priceText,
            featuresText,
            fullText: el.textContent?.trim() || "",
          }
        }, element)

        if (propertyData.title && propertyData.link) {
          // Procesar precio
          const priceMatch = propertyData.priceText.match(/USD\s*([\d.,]+)|U\$S\s*([\d.,]+)|\$\s*([\d.,]+)/i)
          let totalPrice = 0
          if (priceMatch) {
            const priceStr = (priceMatch[1] || priceMatch[2] || priceMatch[3] || "").replace(/[.,]/g, "")
            totalPrice = Number.parseInt(priceStr, 10) || 0
          }

          // Procesar superficie
          const surfaceMatch = propertyData.featuresText.match(/(\d+)\s*m²/i)
          const surface = surfaceMatch ? Number.parseInt(surfaceMatch[1], 10) : 55 // Default 55m²

          const pricePerM2 = surface > 0 ? Math.round(totalPrice / surface) : 0

          const isOwner =
            propertyData.fullText.toLowerCase().includes("dueño") ||
            propertyData.fullText.toLowerCase().includes("directo")

          const neighborhood = extractNeighborhoodFromText(propertyData.title, criteria.neighborhoods || [])

          if (totalPrice > 0 && pricePerM2 > 0) {
            properties.push({
              id: `argenprop-real-${Date.now()}-${i}`,
              title: propertyData.title,
              link: propertyData.link,
              totalPrice,
              surface,
              pricePerM2,
              source: "Argenprop",
              neighborhood,
              isOwner,
              publishedDate: new Date(),
            })
          }
        }
      } catch (error) {
        console.error(`Error processing Argenprop property ${i}:`, error)
      }
    }

    console.log(`✅ Argenprop: ${properties.length} real properties extracted`)
    return properties
  } catch (error) {
    console.error("❌ Argenprop real-time scraping error:", error)
    return []
  }
}

async function scrapeMercadoLibreRealTime(criteria: any): Promise<Property[]> {
  const properties: Property[] = []
  let page: Page | null = null

  try {
    page = await browserManager.getPage()
    console.log("🏠 Starting MercadoLibre real-time scraping...")

    // URL de MercadoLibre Inmuebles
    let searchUrl = "https://inmuebles.mercadolibre.com.ar/departamentos/venta/capital-federal/"

    if (criteria.neighborhoods?.length > 0) {
      const neighborhood = criteria.neighborhoods[0].toLowerCase().replace(/\s+/g, "-")
      searchUrl += `${neighborhood}/`
    }

    console.log("🔗 MercadoLibre URL:", searchUrl)

    await page.goto(searchUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    })

    // Esperar a que carguen los resultados
    await page.waitForSelector(".ui-search-result, .ui-search-layout__item", {
      timeout: 30000,
    })

    await autoScrollPage(page)

    // Extraer propiedades reales
    const propertyElements = await page.$$(".ui-search-result, .ui-search-layout__item")
    console.log(`📋 Found ${propertyElements.length} property elements on MercadoLibre`)

    for (let i = 0; i < Math.min(propertyElements.length, 8); i++) {
      try {
        const element = propertyElements[i]

        const propertyData = await page.evaluate((el) => {
          // Título y link
          const titleLinkEl = el.querySelector(".ui-search-item__title a, .ui-search-result__content-title a")
          const title = titleLinkEl?.textContent?.trim() || ""
          const link = titleLinkEl?.getAttribute("href") || ""

          // Precio
          const priceEl = el.querySelector(".price-tag-amount, .ui-search-price__part")
          const priceText = priceEl?.textContent?.trim() || ""

          // Atributos
          const attributesEl = el.querySelector(".ui-search-card-attributes, .ui-search-attributes")
          const attributesText = attributesEl?.textContent?.trim() || ""

          return {
            title,
            link,
            priceText,
            attributesText,
            fullText: el.textContent?.trim() || "",
          }
        }, element)

        if (propertyData.title && propertyData.link) {
          // Procesar precio
          const priceMatch = propertyData.priceText.match(/USD\s*([\d.,]+)|U\$S\s*([\d.,]+)|\$\s*([\d.,]+)/i)
          let totalPrice = 0
          if (priceMatch) {
            const priceStr = (priceMatch[1] || priceMatch[2] || priceMatch[3] || "").replace(/[.,]/g, "")
            totalPrice = Number.parseInt(priceStr, 10) || 0
          }

          // Procesar superficie
          const surfaceMatch = propertyData.attributesText.match(/(\d+)\s*m²/i)
          const surface = surfaceMatch ? Number.parseInt(surfaceMatch[1], 10) : 60 // Default 60m²

          const pricePerM2 = surface > 0 ? Math.round(totalPrice / surface) : 0

          const isOwner =
            propertyData.fullText.toLowerCase().includes("dueño") ||
            propertyData.fullText.toLowerCase().includes("directo") ||
            propertyData.fullText.toLowerCase().includes("particular")

          const neighborhood = extractNeighborhoodFromText(propertyData.title, criteria.neighborhoods || [])

          if (totalPrice > 0 && pricePerM2 > 0) {
            properties.push({
              id: `mercadolibre-real-${Date.now()}-${i}`,
              title: propertyData.title,
              link: propertyData.link,
              totalPrice,
              surface,
              pricePerM2,
              source: "MercadoLibre",
              neighborhood,
              isOwner,
              publishedDate: new Date(),
            })
          }
        }
      } catch (error) {
        console.error(`Error processing MercadoLibre property ${i}:`, error)
      }
    }

    console.log(`✅ MercadoLibre: ${properties.length} real properties extracted`)
    return properties
  } catch (error) {
    console.error("❌ MercadoLibre real-time scraping error:", error)
    return []
  }
}

// Funciones auxiliares
async function autoScrollPage(page: Page): Promise<void> {
  try {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0
        const distance = 100
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight
          window.scrollBy(0, distance)
          totalHeight += distance

          if (totalHeight >= scrollHeight || totalHeight > 3000) {
            clearInterval(timer)
            resolve()
          }
        }, 100)
      })
    })

    // Esperar a que se carguen elementos dinámicos
    await delay(2000)
  } catch (error) {
    console.error("Error during auto-scroll:", error)
  }
}

function extractNeighborhoodFromText(text: string, targetNeighborhoods: string[] = []): string {
  const lowerText = text.toLowerCase()

  // Buscar en los barrios seleccionados primero
  for (const neighborhood of targetNeighborhoods) {
    if (lowerText.includes(neighborhood.toLowerCase())) {
      return neighborhood
    }
  }

  // Lista de barrios de Buenos Aires
  const allNeighborhoods = [
    "Palermo",
    "Belgrano",
    "Recoleta",
    "Puerto Madero",
    "San Telmo",
    "Villa Crespo",
    "Caballito",
    "Flores",
    "Almagro",
    "Barracas",
    "La Boca",
    "Balvanera",
    "Retiro",
    "Microcentro",
    "Monserrat",
  ]

  for (const neighborhood of allNeighborhoods) {
    if (lowerText.includes(neighborhood.toLowerCase())) {
      return neighborhood
    }
  }

  return "CABA"
}

function applyRealTimeFilters(properties: Property[], criteria: any): Property[] {
  let filtered = [...properties]

  // Filtrar por barrios
  if (criteria.neighborhoods?.length > 0) {
    filtered = filtered.filter((property) =>
      criteria.neighborhoods.some(
        (n: string) =>
          property.neighborhood.toLowerCase() === n.toLowerCase() ||
          property.title.toLowerCase().includes(n.toLowerCase()),
      ),
    )
  }

  // Filtrar por propietario
  if (criteria.ownerOnly) {
    filtered = filtered.filter((property) => property.isOwner)
  }

  // Filtrar por precio por m²
  if (criteria.maxPricePerM2 && criteria.maxPricePerM2 > 0) {
    filtered = filtered.filter((property) => property.pricePerM2 <= criteria.maxPricePerM2 * 1.1)
  }

  // Eliminar duplicados por título similar
  const uniqueProperties = []
  const seenTitles = new Set()

  for (const property of filtered) {
    const normalizedTitle = property.title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .substring(0, 50)

    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle)
      uniqueProperties.push(property)
    }
  }

  // Ordenar por precio por m²
  uniqueProperties.sort((a, b) => a.pricePerM2 - b.pricePerM2)

  return uniqueProperties.slice(0, 20) // Limitar a 20 resultados
}
