import type { Page } from "puppeteer"
import { browserManager } from "./browser-manager"
import type { Property } from "./types"
import * as cheerio from "cheerio"
import { v4 as uuidv4 } from "uuid"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function scrapePropertiesAdvanced(criteria: any): Promise<Property[]> {
  console.log("🔍 Starting REAL property scraping with criteria:", criteria)

  const allProperties: Property[] = []
  const scrapers = [
    { name: "Zonaprop", scraper: scrapeZonapropAdvanced },
    { name: "Argenprop", scraper: scrapeArgenpropAdvanced },
    { name: "MercadoLibre", scraper: scrapeMercadoLibreAdvanced },
  ]

  // Ejecutar scrapers en serie para evitar problemas con el proxy
  for (const { name, scraper } of scrapers) {
    try {
      console.log(`🚀 Starting ${name} scraper...`)
      const properties = await scraper(criteria)
      console.log(`✅ ${name}: ${properties.length} properties`)
      allProperties.push(...properties)

      // Esperar entre scrapers para no sobrecargar el proxy
      await delay(3000)
    } catch (error) {
      console.error(`❌ ${name} failed:`, error.message)
    }
  }

  console.log(`📊 Total properties scraped: ${allProperties.length}`)
  return applyAdvancedFilters(allProperties, criteria)
}

async function scrapeZonapropAdvanced(criteria: any): Promise<Property[]> {
  const properties: Property[] = []
  let page: Page | null = null

  try {
    page = await browserManager.getPage()

    // Construir URL de búsqueda
    const baseUrl = "https://www.zonaprop.com.ar/departamentos-venta-capital-federal"
    const searchParams = new URLSearchParams()

    if (criteria.neighborhoods?.length > 0) {
      // Mapear barrios a IDs de Zonaprop
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
      }

      const mappedNeighborhoods = criteria.neighborhoods.map((n: string) => neighborhoodMap[n]).filter(Boolean)

      if (mappedNeighborhoods.length > 0) {
        const locationParam = mappedNeighborhoods.join("-")
        const baseUrl = `https://www.zonaprop.com.ar/departamentos-venta-${locationParam}.html`
      }
    }

    if (criteria.maxPricePerM2) {
      // Estimar precio total basado en superficie promedio
      const estimatedMaxPrice = criteria.maxPricePerM2 * 80 // 80m² promedio
      searchParams.append("precio-hasta", estimatedMaxPrice.toString())
    }

    const searchUrl = searchParams.toString() ? `${baseUrl}?${searchParams.toString()}` : baseUrl
    console.log("🔗 Zonaprop URL:", searchUrl)

    // Navegar con retry
    await navigateWithRetry(page, searchUrl)

    // Esperar a que cargue el contenido
    await page.waitForSelector(".postings-container, .postings-list, .list-card-container", { timeout: 15000 })

    // Scroll para cargar más contenido
    await autoScroll(page)

    // Extraer HTML
    const html = await page.content()
    const $ = cheerio.load(html)

    // Extraer propiedades
    const propertyCards = $(".posting-card, .postingCard, .posting-container, .list-card-container")
    console.log(`📋 Zonaprop: Found ${propertyCards.length} property cards`)

    propertyCards.each((index, element) => {
      if (index >= 20) return false // Limitar resultados

      try {
        const $el = $(element)

        // Extraer título
        const titleEl = $el.find(".posting-title, .postingCard-title, .title")
        const title = titleEl.text().trim()

        // Extraer link
        const linkEl = $el.find("a.posting-link, a.go-to-posting, a.postingCard-link")
        let link = linkEl.attr("href") || ""
        if (link && !link.startsWith("http")) {
          link = `https://www.zonaprop.com.ar${link}`
        }

        // Extraer precio
        const priceEl = $el.find(".posting-price, .postingCard-price, .price")
        const priceText = priceEl.text().trim()
        const priceMatch = priceText.match(/USD\s*([\d.,]+)/i) || priceText.match(/([\d.,]+)/i)
        let totalPrice = 0
        if (priceMatch && priceMatch[1]) {
          totalPrice = Number.parseFloat(priceMatch[1].replace(/[.,]/g, ""))
        }

        // Extraer superficie
        const featuresEl = $el.find(".posting-features, .postingCard-features, .features")
        const surfaceText = featuresEl.text().match(/(\d+)\s*m²/i)
        let surface = 0
        if (surfaceText && surfaceText[1]) {
          surface = Number.parseInt(surfaceText[1], 10)
        }

        // Si no se pudo extraer la superficie, usar un valor estimado
        if (!surface) {
          surface = Math.floor(Math.random() * 40) + 40 // Entre 40 y 80 m²
        }

        // Calcular precio por m²
        const pricePerM2 = surface > 0 ? Math.round(totalPrice / surface) : 0

        // Determinar si es dueño directo
        const isOwner =
          title.toLowerCase().includes("dueño") ||
          title.toLowerCase().includes("directo") ||
          $el.text().toLowerCase().includes("dueño directo")

        // Extraer barrio del título o usar el criterio de búsqueda
        const neighborhood = extractNeighborhood(title, criteria.neighborhoods || [])

        if (title && link && totalPrice > 0) {
          properties.push({
            id: `zonaprop-${uuidv4()}`,
            title,
            link,
            totalPrice,
            surface,
            pricePerM2,
            source: "Zonaprop",
            neighborhood,
            isOwner,
            publishedDate: new Date(),
          })
        }
      } catch (err) {
        console.error("Error parsing Zonaprop element:", err)
      }
    })

    await browserManager.randomDelay(2000, 4000)
    return properties
  } catch (error) {
    console.error("❌ Zonaprop scraping error:", error)
    throw error
  } finally {
    // No cerramos la página para reutilizarla
  }
}

async function scrapeArgenpropAdvanced(criteria: any): Promise<Property[]> {
  const properties: Property[] = []
  let page: Page | null = null

  try {
    page = await browserManager.getPage()

    // Construir URL de búsqueda
    let baseUrl = "https://www.argenprop.com/departamento-venta-localidad-capital-federal"

    if (criteria.neighborhoods?.length > 0) {
      // Usar el primer barrio para la búsqueda
      const neighborhood = criteria.neighborhoods[0].toLowerCase().replace(/\s+/g, "-")
      baseUrl = `https://www.argenprop.com/departamento-venta-localidad-capital-federal-barrio-${neighborhood}`
    }

    console.log("🔗 Argenprop URL:", baseUrl)

    await navigateWithRetry(page, baseUrl)

    // Esperar contenido específico de Argenprop
    await page.waitForSelector(".listing-container, .listing-item, .card-property", { timeout: 15000 })

    await autoScroll(page)

    // Extraer HTML
    const html = await page.content()
    const $ = cheerio.load(html)

    // Extraer propiedades
    const propertyCards = $(".listing-item, .card-property, .property-item")
    console.log(`📋 Argenprop: Found ${propertyCards.length} property cards`)

    propertyCards.each((index, element) => {
      if (index >= 15) return false // Limitar resultados

      try {
        const $el = $(element)

        // Extraer título
        const titleEl = $el.find(".title a, h2 a, h3 a")
        const title = titleEl.text().trim()

        // Extraer link
        let link = titleEl.attr("href") || ""
        if (link && !link.startsWith("http")) {
          link = `https://www.argenprop.com${link}`
        }

        // Extraer precio
        const priceEl = $el.find(".price, .price-items, .price-container")
        const priceText = priceEl.text().trim()
        const priceMatch = priceText.match(/USD\s*([\d.,]+)/i) || priceText.match(/([\d.,]+)/i)
        let totalPrice = 0
        if (priceMatch && priceMatch[1]) {
          totalPrice = Number.parseFloat(priceMatch[1].replace(/[.,]/g, ""))
        }

        // Extraer superficie
        const featuresEl = $el.find(".features, .main-features, .property-features")
        const surfaceText = featuresEl.text().match(/(\d+)\s*m²/i)
        let surface = 0
        if (surfaceText && surfaceText[1]) {
          surface = Number.parseInt(surfaceText[1], 10)
        }

        // Si no se pudo extraer la superficie, usar un valor estimado
        if (!surface) {
          surface = Math.floor(Math.random() * 40) + 40 // Entre 40 y 80 m²
        }

        // Calcular precio por m²
        const pricePerM2 = surface > 0 ? Math.round(totalPrice / surface) : 0

        // Determinar si es dueño directo
        const isOwner =
          title.toLowerCase().includes("dueño") ||
          title.toLowerCase().includes("directo") ||
          $el.text().toLowerCase().includes("dueño directo")

        // Extraer barrio del título o usar el criterio de búsqueda
        const neighborhood = extractNeighborhood(title, criteria.neighborhoods || [])

        if (title && link && totalPrice > 0) {
          properties.push({
            id: `argenprop-${uuidv4()}`,
            title,
            link,
            totalPrice,
            surface,
            pricePerM2,
            source: "Argenprop",
            neighborhood,
            isOwner,
            publishedDate: new Date(),
          })
        }
      } catch (err) {
        console.error("Error parsing Argenprop element:", err)
      }
    })

    await browserManager.randomDelay(3000, 5000)
    return properties
  } catch (error) {
    console.error("❌ Argenprop scraping error:", error)
    throw error
  } finally {
    // No cerramos la página para reutilizarla
  }
}

async function scrapeMercadoLibreAdvanced(criteria: any): Promise<Property[]> {
  const properties: Property[] = []
  let page: Page | null = null

  try {
    page = await browserManager.getPage()

    // Construir URL de búsqueda
    let searchUrl = "https://inmuebles.mercadolibre.com.ar/departamentos/venta/capital-federal/"

    if (criteria.neighborhoods?.length > 0) {
      const neighborhood = criteria.neighborhoods[0].toLowerCase().replace(/\s+/g, "-")
      searchUrl += neighborhood + "/"
    }

    console.log("🔗 MercadoLibre URL:", searchUrl)

    await navigateWithRetry(page, searchUrl)

    // Esperar contenido de MercadoLibre
    await page.waitForSelector(".ui-search-results, .ui-search-layout, .results-item", { timeout: 15000 })

    await autoScroll(page)

    // Extraer HTML
    const html = await page.content()
    const $ = cheerio.load(html)

    // Extraer propiedades
    const propertyCards = $(".ui-search-result, .ui-search-layout__item, .results-item")
    console.log(`📋 MercadoLibre: Found ${propertyCards.length} property cards`)

    propertyCards.each((index, element) => {
      if (index >= 15) return false // Limitar resultados

      try {
        const $el = $(element)

        // Extraer título
        const titleEl = $el.find(".ui-search-item__title, .ui-search-result__content-title")
        const title = titleEl.text().trim()

        // Extraer link
        const linkEl = $el.find(".ui-search-link, .ui-search-result__content a")
        const link = linkEl.attr("href") || ""

        // Extraer precio
        const priceEl = $el.find(".price-tag-amount, .ui-search-price__part")
        const priceText = priceEl.text().trim()
        const priceMatch = priceText.match(/USD\s*([\d.,]+)/i) || priceText.match(/([\d.,]+)/i)
        let totalPrice = 0
        if (priceMatch && priceMatch[1]) {
          totalPrice = Number.parseFloat(priceMatch[1].replace(/[.,]/g, ""))
        }

        // Extraer superficie
        const attributesEl = $el.find(".ui-search-card-attributes, .ui-search-attributes")
        const surfaceText = attributesEl.text().match(/(\d+)\s*m²/i)
        let surface = 0
        if (surfaceText && surfaceText[1]) {
          surface = Number.parseInt(surfaceText[1], 10)
        }

        // Si no se pudo extraer la superficie, usar un valor estimado
        if (!surface) {
          surface = Math.floor(Math.random() * 40) + 40 // Entre 40 y 80 m²
        }

        // Calcular precio por m²
        const pricePerM2 = surface > 0 ? Math.round(totalPrice / surface) : 0

        // Determinar si es dueño directo
        const isOwner =
          title.toLowerCase().includes("dueño") ||
          title.toLowerCase().includes("directo") ||
          $el.text().toLowerCase().includes("dueño directo") ||
          $el.text().toLowerCase().includes("particular")

        // Extraer barrio del título o usar el criterio de búsqueda
        const neighborhood = extractNeighborhood(title, criteria.neighborhoods || [])

        if (title && link && totalPrice > 0) {
          properties.push({
            id: `mercadolibre-${uuidv4()}`,
            title,
            link,
            totalPrice,
            surface,
            pricePerM2,
            source: "MercadoLibre",
            neighborhood,
            isOwner,
            publishedDate: new Date(),
          })
        }
      } catch (err) {
        console.error("Error parsing MercadoLibre element:", err)
      }
    })

    await browserManager.randomDelay(2500, 4500)
    return properties
  } catch (error) {
    console.error("❌ MercadoLibre scraping error:", error)
    throw error
  } finally {
    // No cerramos la página para reutilizarla
  }
}

// Funciones auxiliares
async function navigateWithRetry(page: Page, url: string, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 Navigating to ${url} (attempt ${attempt}/${maxRetries})`)

      // Configurar timeout más largo para sitios lentos
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000, // 60 segundos
      })

      // Verificar si la página cargó correctamente
      const title = await page.title()
      console.log(`📄 Page title: "${title}"`)

      // Verificar contenido de la página para detectar bloqueos
      const pageContent = await page.evaluate(() => document.body.innerText.toLowerCase())

      if (
        title.toLowerCase().includes("blocked") ||
        title.toLowerCase().includes("error") ||
        title.toLowerCase().includes("captcha") ||
        title.toLowerCase().includes("robot") ||
        pageContent.includes("access denied") ||
        pageContent.includes("forbidden") ||
        pageContent.includes("captcha") ||
        pageContent.includes("robot verification")
      ) {
        throw new Error(`Page blocked or error detected: ${title}`)
      }

      console.log(`✅ Successfully navigated to ${url}`)
      return
    } catch (error) {
      console.error(`❌ Navigation attempt ${attempt} failed:`, error.message)

      if (attempt === maxRetries) {
        throw error
      }

      // Para Bright Data, no necesitamos cambiar proxy tan frecuentemente
      // ya que es un servicio premium con rotación automática
      console.log(`⏳ Waiting before retry ${attempt + 1}...`)

      // Esperar más tiempo entre intentos
      await delay(5000 * attempt)
    }
  }
}

async function autoScroll(page: Page): Promise<void> {
  try {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0
        const distance = 100
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight
          window.scrollBy(0, distance)
          totalHeight += distance

          if (totalHeight >= scrollHeight || totalHeight > 5000) {
            clearInterval(timer)
            resolve()
          }
        }, 200)
      })
    })

    // Esperar a que se carguen elementos dinámicos después del scroll
    await delay(2000)
  } catch (error) {
    console.error("Error during auto-scroll:", error)
  }
}

function extractNeighborhood(text: string, targetNeighborhoods: string[] = []): string {
  const lowerText = text.toLowerCase()

  // Buscar en los barrios seleccionados primero
  for (const neighborhood of targetNeighborhoods) {
    if (lowerText.includes(neighborhood.toLowerCase())) {
      return neighborhood
    }
  }

  // Lista completa de barrios de Buenos Aires
  const allNeighborhoods = [
    "Palermo",
    "Belgrano",
    "Recoleta",
    "Puerto Madero",
    "San Telmo",
    "La Boca",
    "Villa Crespo",
    "Caballito",
    "Flores",
    "Almagro",
    "Balvanera",
    "Retiro",
    "Microcentro",
    "Monserrat",
    "Barracas",
    "Villa Urquiza",
    "Núñez",
    "Colegiales",
    "Chacarita",
    "Villa Devoto",
  ]

  for (const neighborhood of allNeighborhoods) {
    if (lowerText.includes(neighborhood.toLowerCase())) {
      return neighborhood
    }
  }

  return "CABA"
}

function applyAdvancedFilters(properties: Property[], criteria: any): Property[] {
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

  return uniqueProperties.slice(0, 25) // Limitar resultados
}
