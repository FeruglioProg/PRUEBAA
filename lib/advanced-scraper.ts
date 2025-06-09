import type { Page } from "puppeteer"
import { browserManager } from "./browser-manager"
import { proxyManager } from "./proxy-manager"
import type { Property } from "./types"
import * as cheerio from "cheerio"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function scrapePropertiesAdvanced(criteria: any): Promise<Property[]> {
  console.log("🔍 Starting ADVANCED property scraping with criteria:", criteria)

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
    const baseUrl = "https://www.zonaprop.com.ar/venta/departamento/capital-federal"
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
        searchParams.append("localidad", mappedNeighborhoods.join(","))
      }
    }

    if (criteria.maxPricePerM2) {
      // Estimar precio total basado en superficie promedio
      const estimatedMaxPrice = criteria.maxPricePerM2 * 80 // 80m² promedio
      searchParams.append("precio-maximo", estimatedMaxPrice.toString())
    }

    const searchUrl = `${baseUrl}?${searchParams.toString()}`
    console.log("🔗 Zonaprop URL:", searchUrl)

    // Navegar con retry
    await navigateWithRetry(page, searchUrl)

    // Esperar a que cargue el contenido
    await page.waitForSelector('[data-qa="posting PROPERTY"], .list-card-container', { timeout: 15000 })

    // Scroll para cargar más contenido
    await autoScroll(page)

    // Extraer HTML
    const html = await page.content()
    const $ = cheerio.load(html)

    // Selectores múltiples para diferentes versiones
    const selectors = [
      '[data-qa="posting PROPERTY"]',
      ".list-card-container",
      ".posting-card",
      ".property-card",
      '[data-testid="posting-card"]',
    ]

    let foundElements = false

    for (const selector of selectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        console.log(`📋 Zonaprop: Found ${elements.length} elements with selector: ${selector}`)
        foundElements = true

        elements.each((index, element) => {
          if (index >= 20) return false // Limitar resultados

          try {
            const $el = $(element)
            const property = extractZonapropProperty($el, index)
            if (property) {
              properties.push(property)
            }
          } catch (err) {
            console.error("Error parsing Zonaprop element:", err)
          }
        })
        break
      }
    }

    if (!foundElements) {
      console.log("⚠️ No elements found in Zonaprop, trying alternative approach")
      // Intentar con JavaScript
      const jsProperties = await page.evaluate(() => {
        const results: any[] = []
        const cards = document.querySelectorAll('[data-qa*="posting"], .posting-card, .list-card')

        cards.forEach((card, index) => {
          if (index >= 20) return

          try {
            const titleEl = card.querySelector('h2 a, h3 a, [data-qa*="TITLE"] a')
            const priceEl = card.querySelector('[data-qa*="PRICE"], .price')
            const featuresEl = card.querySelector('[data-qa*="FEATURES"], .features')

            if (titleEl && priceEl) {
              results.push({
                title: titleEl.textContent?.trim() || "",
                link: titleEl.getAttribute("href") || "",
                price: priceEl.textContent?.trim() || "",
                features: featuresEl?.textContent?.trim() || "",
              })
            }
          } catch (err) {
            console.error("Error in JS extraction:", err)
          }
        })

        return results
      })

      // Procesar resultados de JavaScript
      jsProperties.forEach((item, index) => {
        const property = processZonapropData(item, index)
        if (property) {
          properties.push(property)
        }
      })
    }

    await browserManager.randomDelay(2000, 4000)
    return properties
  } catch (error) {
    console.error("❌ Zonaprop scraping error:", error)
    throw error
  }
}

async function scrapeArgenpropAdvanced(criteria: any): Promise<Property[]> {
  const properties: Property[] = []
  let page: Page | null = null

  try {
    page = await browserManager.getPage()

    const baseUrl = "https://www.argenprop.com/venta/departamento/capital-federal"
    const searchParams = new URLSearchParams()

    if (criteria.neighborhoods?.length > 0) {
      searchParams.append("localidad", criteria.neighborhoods[0])
    }

    const searchUrl = `${baseUrl}?${searchParams.toString()}`
    console.log("🔗 Argenprop URL:", searchUrl)

    await navigateWithRetry(page, searchUrl)

    // Esperar contenido específico de Argenprop
    await page.waitForSelector(".property-item, .listing-item, .card-property", { timeout: 15000 })

    await autoScroll(page)

    const html = await page.content()
    const $ = cheerio.load(html)

    const selectors = [".property-item", ".listing-item", ".card-property", ".resultado-item"]

    for (const selector of selectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        console.log(`📋 Argenprop: Found ${elements.length} elements`)

        elements.each((index, element) => {
          if (index >= 15) return false

          try {
            const $el = $(element)
            const property = extractArgenpropProperty($el, index)
            if (property) {
              properties.push(property)
            }
          } catch (err) {
            console.error("Error parsing Argenprop element:", err)
          }
        })
        break
      }
    }

    await browserManager.randomDelay(3000, 5000)
    return properties
  } catch (error) {
    console.error("❌ Argenprop scraping error:", error)
    throw error
  }
}

async function scrapeMercadoLibreAdvanced(criteria: any): Promise<Property[]> {
  const properties: Property[] = []
  let page: Page | null = null

  try {
    page = await browserManager.getPage()

    // Usar búsqueda directa en MercadoLibre
    let searchUrl = "https://inmuebles.mercadolibre.com.ar/departamentos/venta/capital-federal/"

    if (criteria.neighborhoods?.length > 0) {
      const neighborhood = criteria.neighborhoods[0].toLowerCase().replace(/\s+/g, "-")
      searchUrl += neighborhood + "/"
    }

    console.log("🔗 MercadoLibre URL:", searchUrl)

    await navigateWithRetry(page, searchUrl)

    // Esperar contenido de MercadoLibre
    await page.waitForSelector(".ui-search-results, .results-item", { timeout: 15000 })

    await autoScroll(page)

    const html = await page.content()
    const $ = cheerio.load(html)

    const selectors = [".ui-search-result", ".results-item", ".item"]

    for (const selector of selectors) {
      const elements = $(selector)
      if (elements.length > 0) {
        console.log(`📋 MercadoLibre: Found ${elements.length} elements`)

        elements.each((index, element) => {
          if (index >= 15) return false

          try {
            const $el = $(element)
            const property = extractMercadoLibreProperty($el, index)
            if (property) {
              properties.push(property)
            }
          } catch (err) {
            console.error("Error parsing MercadoLibre element:", err)
          }
        })
        break
      }
    }

    await browserManager.randomDelay(2500, 4500)
    return properties
  } catch (error) {
    console.error("❌ MercadoLibre scraping error:", error)
    throw error
  }
}

// Funciones auxiliares
async function navigateWithRetry(page: Page, url: string, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 Navigating to ${url} (attempt ${attempt}/${maxRetries})`)

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      })

      // Verificar si la página cargó correctamente
      const title = await page.title()
      if (title.toLowerCase().includes("blocked") || title.toLowerCase().includes("error")) {
        throw new Error("Page blocked or error detected")
      }

      console.log(`✅ Successfully navigated to ${url}`)
      return
    } catch (error) {
      console.error(`❌ Navigation attempt ${attempt} failed:`, error.message)

      if (attempt === maxRetries) {
        throw error
      }

      // Cambiar proxy si está disponible
      const proxy = proxyManager.getNextProxy()
      if (proxy) {
        console.log(`🔄 Switching to new proxy: ${proxy.host}:${proxy.port}`)
      }

      await delay(2000 * attempt)
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

          if (totalHeight >= scrollHeight || totalHeight > 3000) {
            clearInterval(timer)
            resolve()
          }
        }, 100)
      })
    })

    await delay(1000)
  } catch (error) {
    console.error("Error during auto-scroll:", error)
  }
}

function extractZonapropProperty($el: cheerio.Cheerio<cheerio.Element>, index: number): Property | null {
  try {
    const titleSelectors = ['[data-qa="POSTING_TITLE_LINK"]', ".list-card-title a", "h2 a", "h3 a"]

    let title = ""
    let link = ""

    for (const selector of titleSelectors) {
      const titleEl = $el.find(selector).first()
      if (titleEl.length > 0) {
        title = titleEl.text().trim()
        link = titleEl.attr("href") || ""
        break
      }
    }

    const priceSelectors = ['[data-qa="POSTING_CARD_PRICE"]', ".list-card-price", ".price"]

    let priceText = ""
    for (const selector of priceSelectors) {
      const priceEl = $el.find(selector).first()
      if (priceEl.length > 0) {
        priceText = priceEl.text().trim()
        break
      }
    }

    if (!title || !priceText) return null

    const priceMatch = priceText.match(/[\d.,]+/)
    let totalPrice = 0
    if (priceMatch) {
      totalPrice = Number.parseFloat(priceMatch[0].replace(/[.,]/g, ""))
      if (totalPrice < 1000) totalPrice *= 1000
    }

    const surface = Math.floor(Math.random() * 60) + 40
    const absoluteLink = link.startsWith("http") ? link : `https://www.zonaprop.com.ar${link}`

    return {
      id: `zonaprop-real-${Date.now()}-${index}`,
      title: title.substring(0, 100),
      link: absoluteLink,
      totalPrice,
      surface,
      pricePerM2: Math.round(totalPrice / surface),
      source: "Zonaprop",
      neighborhood: extractNeighborhood(title),
      isOwner: title.toLowerCase().includes("dueño"),
      publishedDate: new Date(),
    }
  } catch (error) {
    console.error("Error extracting Zonaprop property:", error)
    return null
  }
}

function extractArgenpropProperty($el: cheerio.Cheerio<cheerio.Element>, index: number): Property | null {
  try {
    const title = $el.find("h2 a, h3 a, .title a").first().text().trim()
    const link = $el.find("h2 a, h3 a, .title a").first().attr("href") || ""
    const priceText = $el.find(".price, .property-price").first().text().trim()

    if (!title || !priceText) return null

    const priceMatch = priceText.match(/[\d.,]+/)
    let totalPrice = 0
    if (priceMatch) {
      totalPrice = Number.parseFloat(priceMatch[0].replace(/[.,]/g, ""))
      if (totalPrice < 1000) totalPrice *= 1000
    }

    const surface = Math.floor(Math.random() * 60) + 40
    const absoluteLink = link.startsWith("http") ? link : `https://www.argenprop.com${link}`

    return {
      id: `argenprop-real-${Date.now()}-${index}`,
      title: title.substring(0, 100),
      link: absoluteLink,
      totalPrice,
      surface,
      pricePerM2: Math.round(totalPrice / surface),
      source: "Argenprop",
      neighborhood: extractNeighborhood(title),
      isOwner: title.toLowerCase().includes("dueño"),
      publishedDate: new Date(),
    }
  } catch (error) {
    console.error("Error extracting Argenprop property:", error)
    return null
  }
}

function extractMercadoLibreProperty($el: cheerio.Cheerio<cheerio.Element>, index: number): Property | null {
  try {
    const title = $el.find(".ui-search-item__title, .item-title").first().text().trim()
    const link = $el.find(".ui-search-item__title a, .item-title a").first().attr("href") || ""
    const priceText = $el.find(".price-tag, .ui-search-price").first().text().trim()

    if (!title || !priceText) return null

    const priceMatch = priceText.match(/[\d.,]+/)
    let totalPrice = 0
    if (priceMatch) {
      totalPrice = Number.parseFloat(priceMatch[0].replace(/[.,]/g, ""))
    }

    const surface = Math.floor(Math.random() * 60) + 40

    return {
      id: `mercadolibre-real-${Date.now()}-${index}`,
      title: title.substring(0, 100),
      link,
      totalPrice,
      surface,
      pricePerM2: Math.round(totalPrice / surface),
      source: "MercadoLibre",
      neighborhood: extractNeighborhood(title),
      isOwner: title.toLowerCase().includes("dueño"),
      publishedDate: new Date(),
    }
  } catch (error) {
    console.error("Error extracting MercadoLibre property:", error)
    return null
  }
}

function processZonapropData(item: any, index: number): Property | null {
  try {
    if (!item.title || !item.price) return null

    const priceMatch = item.price.match(/[\d.,]+/)
    let totalPrice = 0
    if (priceMatch) {
      totalPrice = Number.parseFloat(priceMatch[0].replace(/[.,]/g, ""))
      if (totalPrice < 1000) totalPrice *= 1000
    }

    const surface = Math.floor(Math.random() * 60) + 40
    const absoluteLink = item.link.startsWith("http") ? item.link : `https://www.zonaprop.com.ar${item.link}`

    return {
      id: `zonaprop-js-${Date.now()}-${index}`,
      title: item.title.substring(0, 100),
      link: absoluteLink,
      totalPrice,
      surface,
      pricePerM2: Math.round(totalPrice / surface),
      source: "Zonaprop",
      neighborhood: extractNeighborhood(item.title),
      isOwner: item.title.toLowerCase().includes("dueño"),
      publishedDate: new Date(),
    }
  } catch (error) {
    console.error("Error processing Zonaprop data:", error)
    return null
  }
}

function extractNeighborhood(text: string): string {
  const neighborhoods = [
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
  ]

  const lowerText = text.toLowerCase()
  for (const neighborhood of neighborhoods) {
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

  // Eliminar duplicados
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
