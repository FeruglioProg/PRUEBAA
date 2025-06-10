import type { Page } from "puppeteer"
import { simpleBrowserManager } from "./browser-manager-simple"
import type { Property } from "./types"
import * as cheerio from "cheerio"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface NeighborhoodPrice {
  neighborhood: string
  maxPricePerM2?: number
}

export async function scrapePropertiesRealTimeSimple(criteria: any): Promise<Property[]> {
  console.log("🔍 Starting REAL-ONLY property scraping with criteria:", criteria)

  const allProperties: Property[] = []

  // Ejecutar scrapers en serie para evitar problemas
  const scrapers = [
    { name: "Zonaprop", scraper: scrapeZonapropReal },
    { name: "Argenprop", scraper: scrapeArgenpropReal },
    { name: "MercadoLibre", scraper: scrapeMercadoLibreReal },
  ]

  for (const { name, scraper } of scrapers) {
    try {
      console.log(`🚀 Starting ${name} scraper...`)
      const properties = await scraper(criteria)
      console.log(`✅ ${name}: ${properties.length} properties`)
      allProperties.push(...properties)

      // Esperar entre scrapers
      await delay(3000)
    } catch (error) {
      console.error(`❌ ${name} failed:`, error.message)
      // Continuar con el siguiente scraper
    }
  }

  console.log(`📊 Total REAL properties scraped: ${allProperties.length}`)

  // NO usar datos de respaldo - solo devolver propiedades reales
  return applyRealFilters(allProperties, criteria)
}

async function scrapeZonapropReal(criteria: any): Promise<Property[]> {
  const properties: Property[] = []
  let page: Page | null = null

  try {
    page = await simpleBrowserManager.getPage()
    console.log("🏠 Starting Zonaprop REAL-ONLY scraping...")

    // Construir URL más específica si hay barrios
    let searchUrl = "https://www.zonaprop.com.ar/departamentos-venta-capital-federal.html"

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

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    })

    await delay(5000)

    // Scroll para cargar más contenido
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })
    await delay(3000)

    // Hacer scroll adicional para cargar más propiedades
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await delay(4000)

    // Scroll hacia arriba y abajo para activar lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 3)
    })
    await delay(2000)

    const content = await page.content()
    const $ = cheerio.load(content)

    // Buscar elementos de propiedades con múltiples selectores
    let propertyElements = $('[data-qa="posting PROPERTY"]')
    if (propertyElements.length === 0) {
      propertyElements = $(".posting-card")
    }
    if (propertyElements.length === 0) {
      propertyElements = $(".postingCard")
    }
    if (propertyElements.length === 0) {
      propertyElements = $(".posting-container")
    }
    if (propertyElements.length === 0) {
      propertyElements = $("[data-to-posting]")
    }
    if (propertyElements.length === 0) {
      propertyElements = $("article")
    }

    console.log(`📋 Found ${propertyElements.length} property elements on Zonaprop`)

    // Si no encontramos elementos específicos, buscar de forma más amplia
    if (propertyElements.length === 0) {
      console.log("🔍 Trying broader selectors...")
      propertyElements = $("div").filter((i, el) => {
        const text = $(el).text()
        return (
          text.includes("USD") &&
          text.includes("m²") &&
          text.length > 200 &&
          text.length < 2000 &&
          $(el).find("a[href]").length > 0
        )
      })
      console.log(`📋 Found ${propertyElements.length} potential property elements`)
    }

    propertyElements.slice(0, 20).each((index, element) => {
      try {
        const $el = $(element)
        const fullText = $el.text()

        // Extraer título con múltiples estrategias
        let title = ""

        // Estrategia 1: Selectores específicos
        const titleSelectors = [
          '[data-qa="POSTING_TITLE"]',
          ".posting-title",
          "h2",
          "h3",
          ".title",
          "a[title]",
          ".postingCard-title",
        ]

        for (const selector of titleSelectors) {
          const titleEl = $el.find(selector).first()
          if (titleEl.length && titleEl.text().trim()) {
            title = titleEl.text().trim()
            break
          }
        }

        // Estrategia 2: Buscar en atributos
        if (!title) {
          const linkWithTitle = $el.find("a[title]").first()
          if (linkWithTitle.length) {
            title = linkWithTitle.attr("title") || ""
          }
        }

        // Estrategia 3: Extraer del texto completo (líneas que parecen títulos)
        if (!title) {
          const lines = fullText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)

          for (const line of lines) {
            if (
              line.length > 20 &&
              line.length < 120 &&
              (line.toLowerCase().includes("departamento") ||
                line.toLowerCase().includes("ambiente") ||
                line.toLowerCase().includes("monoambiente") ||
                line.toLowerCase().includes("venta")) &&
              !line.includes("USD") &&
              !line.includes("m²")
            ) {
              title = line
              break
            }
          }
        }

        // Extraer link
        let link = ""
        const linkSelectors = [
          'a[data-qa="POSTING_TITLE"]',
          'a[href*="/propiedades/"]',
          'a[href*="/departamento-"]',
          "a[data-to-posting]",
          ".posting-title a",
          "h2 a",
          "h3 a",
        ]

        for (const selector of linkSelectors) {
          const linkEl = $el.find(selector).first()
          if (linkEl.length && linkEl.attr("href")) {
            link = linkEl.attr("href") || ""
            break
          }
        }

        if (!link) {
          const anyLink = $el.find("a[href]").first()
          if (anyLink.length) {
            const href = anyLink.attr("href") || ""
            if (href.includes("/propiedades/") || href.includes("/departamento-")) {
              link = href
            }
          }
        }

        if (link && !link.startsWith("http")) {
          link = `https://www.zonaprop.com.ar${link}`
        }

        // Extraer precio del texto completo con validación estricta
        let totalPrice = 0
        const pricePatterns = [
          /USD\s*([\d.,]+)/gi,
          /U\$S\s*([\d.,]+)/gi,
          /\$\s*([\d.,]+)/gi,
          /([\d.,]+)\s*USD/gi,
          /([\d.,]+)\s*dólares/gi,
        ]

        for (const pattern of pricePatterns) {
          const matches = Array.from(fullText.matchAll(pattern))
          for (const match of matches) {
            if (match[1]) {
              const priceStr = match[1].replace(/[.,]/g, "")
              const parsedPrice = Number.parseInt(priceStr, 10)
              // Validación estricta de precios realistas
              if (parsedPrice >= 80000 && parsedPrice <= 2000000) {
                totalPrice = parsedPrice
                break
              }
            }
          }
          if (totalPrice > 0) break
        }

        // Extraer superficie con validación estricta
        let surface = 0
        const surfacePatterns = [/(\d+)\s*m²/gi, /(\d+)\s*m2/gi, /superficie[:\s]*(\d+)/gi]

        for (const pattern of surfacePatterns) {
          const matches = Array.from(fullText.matchAll(pattern))
          for (const match of matches) {
            if (match[1]) {
              const surfaceValue = Number.parseInt(match[1], 10)
              // Validación estricta de superficie realista
              if (surfaceValue >= 20 && surfaceValue <= 300) {
                surface = surfaceValue
                break
              }
            }
          }
          if (surface > 0) break
        }

        console.log(`🔍 Zonaprop Element ${index}:`, {
          title: title.substring(0, 50),
          link: link.substring(0, 80),
          totalPrice,
          surface,
          hasValidData: !!(title && link && totalPrice > 0 && surface > 0),
        })

        // SOLO agregar si tenemos TODOS los datos válidos
        if (
          title &&
          link &&
          totalPrice > 0 &&
          surface > 0 &&
          (link.includes("/propiedades/") || link.includes("/departamento-"))
        ) {
          const pricePerM2 = Math.round(totalPrice / surface)

          // Validación final del precio por m²
          if (pricePerM2 >= 1000 && pricePerM2 <= 8000) {
            const isOwner = fullText.toLowerCase().includes("dueño") || fullText.toLowerCase().includes("directo")
            const neighborhood = extractNeighborhoodFromText(title, criteria.neighborhoods || [])

            properties.push({
              id: `zonaprop-real-${Date.now()}-${index}`,
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

            console.log(
              `✅ Added REAL Zonaprop property: ${title.substring(0, 40)}... - $${totalPrice} (${pricePerM2}/m²)`,
            )
          } else {
            console.log(`❌ Rejected unrealistic price/m²: ${pricePerM2} for ${title.substring(0, 30)}`)
          }
        } else {
          console.log(
            `❌ Skipped incomplete data: title=${!!title}, link=${!!link}, price=${totalPrice}, surface=${surface}`,
          )
        }
      } catch (err) {
        console.error(`Error processing Zonaprop element ${index}:`, err)
      }
    })

    console.log(`✅ Zonaprop: ${properties.length} REAL properties extracted`)
    return properties
  } catch (error) {
    console.error("❌ Zonaprop real scraping error:", error)
    return []
  }
}

async function scrapeArgenpropReal(criteria: any): Promise<Property[]> {
  const properties: Property[] = []
  let page: Page | null = null

  try {
    page = await simpleBrowserManager.getPage()
    console.log("🏠 Starting Argenprop REAL-ONLY scraping...")

    let searchUrl = "https://www.argenprop.com/departamento-venta-localidad-capital-federal"

    if (criteria.neighborhoods?.length > 0) {
      const neighborhood = criteria.neighborhoods[0].toLowerCase().replace(/\s+/g, "-")
      searchUrl = `https://www.argenprop.com/departamento-venta-localidad-capital-federal-barrio-${neighborhood}`
    }

    console.log("🔗 Argenprop URL:", searchUrl)

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    })

    await delay(5000)

    // Scroll para cargar contenido
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })
    await delay(3000)

    // Hacer scroll adicional para cargar más propiedades
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await delay(4000)

    // Scroll hacia arriba y abajo para activar lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 3)
    })
    await delay(2000)

    const content = await page.content()
    const $ = cheerio.load(content)

    // Buscar elementos de propiedades en Argenprop
    let propertyElements = $(".listing-item")
    if (propertyElements.length === 0) {
      propertyElements = $(".card-property")
    }
    if (propertyElements.length === 0) {
      propertyElements = $(".property-item")
    }
    if (propertyElements.length === 0) {
      propertyElements = $(".listing__item")
    }
    if (propertyElements.length === 0) {
      propertyElements = $("[data-item-id]")
    }

    console.log(`📋 Found ${propertyElements.length} property elements on Argenprop`)

    // Si no encontramos elementos específicos, buscar de forma más amplia
    if (propertyElements.length === 0) {
      console.log("🔍 Trying broader selectors for Argenprop...")
      propertyElements = $("div").filter((i, el) => {
        const text = $(el).text()
        return (
          text.includes("USD") &&
          text.includes("m²") &&
          text.length > 200 &&
          text.length < 2000 &&
          $(el).find("a[href]").length > 0
        )
      })
      console.log(`📋 Found ${propertyElements.length} potential property elements`)
    }

    propertyElements.slice(0, 15).each((index, element) => {
      try {
        const $el = $(element)
        const fullText = $el.text()

        // Extraer título y link
        let title = ""
        let link = ""

        const titleLinkSelectors = [
          ".title a",
          "h2 a",
          "h3 a",
          ".listing__title a",
          ".card-title a",
          'a[href*="/departamento-"]',
          'a[href*="/inmueble/"]',
        ]

        for (const selector of titleLinkSelectors) {
          const titleLinkEl = $el.find(selector).first()
          if (titleLinkEl.length) {
            title = titleLinkEl.text().trim()
            link = titleLinkEl.attr("href") || ""
            if (title && link) break
          }
        }

        // Si no encontramos con los selectores anteriores, buscar por separado
        if (!title) {
          const titleSelectors = [".title", "h2", "h3", ".listing__title", ".card-title"]
          for (const selector of titleSelectors) {
            const titleEl = $el.find(selector).first()
            if (titleEl.length && titleEl.text().trim()) {
              title = titleEl.text().trim()
              break
            }
          }
        }

        if (!link) {
          const linkEl = $el.find('a[href*="/departamento-"], a[href*="/inmueble/"]').first()
          if (linkEl.length) {
            link = linkEl.attr("href") || ""
          }
        }

        if (link && !link.startsWith("http")) {
          link = `https://www.argenprop.com${link}`
        }

        // Extraer precio con validación estricta
        let totalPrice = 0
        const pricePatterns = [
          /USD\s*([\d.,]+)/gi,
          /U\$S\s*([\d.,]+)/gi,
          /\$\s*([\d.,]+)/gi,
          /([\d.,]+)\s*USD/gi,
          /([\d.,]+)\s*dólares/gi,
        ]

        for (const pattern of pricePatterns) {
          const matches = Array.from(fullText.matchAll(pattern))
          for (const match of matches) {
            if (match[1]) {
              const priceStr = match[1].replace(/[.,]/g, "")
              const parsedPrice = Number.parseInt(priceStr, 10)
              if (parsedPrice >= 80000 && parsedPrice <= 2000000) {
                totalPrice = parsedPrice
                break
              }
            }
          }
          if (totalPrice > 0) break
        }

        // Extraer superficie con validación estricta
        let surface = 0
        const surfacePatterns = [/(\d+)\s*m²/gi, /(\d+)\s*m2/gi, /superficie[:\s]*(\d+)/gi]

        for (const pattern of surfacePatterns) {
          const matches = Array.from(fullText.matchAll(pattern))
          for (const match of matches) {
            if (match[1]) {
              const surfaceValue = Number.parseInt(match[1], 10)
              if (surfaceValue >= 20 && surfaceValue <= 300) {
                surface = surfaceValue
                break
              }
            }
          }
          if (surface > 0) break
        }

        console.log(`🔍 Argenprop Element ${index}:`, {
          title: title.substring(0, 50),
          link: link.substring(0, 80),
          totalPrice,
          surface,
          hasValidData: !!(title && link && totalPrice > 0 && surface > 0),
        })

        // SOLO agregar si tenemos TODOS los datos válidos
        if (
          title &&
          link &&
          totalPrice > 0 &&
          surface > 0 &&
          (link.includes("/departamento-") || link.includes("/inmueble/"))
        ) {
          const pricePerM2 = Math.round(totalPrice / surface)

          if (pricePerM2 >= 1000 && pricePerM2 <= 8000) {
            const isOwner = fullText.toLowerCase().includes("dueño") || fullText.toLowerCase().includes("directo")
            const neighborhood = extractNeighborhoodFromText(title, criteria.neighborhoods || [])

            properties.push({
              id: `argenprop-real-${Date.now()}-${index}`,
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

            console.log(
              `✅ Added REAL Argenprop property: ${title.substring(0, 40)}... - $${totalPrice} (${pricePerM2}/m²)`,
            )
          }
        }
      } catch (err) {
        console.error(`Error processing Argenprop element ${index}:`, err)
      }
    })

    console.log(`✅ Argenprop: ${properties.length} REAL properties extracted`)
    return properties
  } catch (error) {
    console.error("❌ Argenprop real scraping error:", error)
    return []
  }
}

async function scrapeMercadoLibreReal(criteria: any): Promise<Property[]> {
  const properties: Property[] = []
  let page: Page | null = null

  try {
    page = await simpleBrowserManager.getPage()
    console.log("🏠 Starting MercadoLibre REAL-ONLY scraping...")

    let searchUrl = "https://inmuebles.mercadolibre.com.ar/departamentos/venta/capital-federal/"

    if (criteria.neighborhoods?.length > 0) {
      const neighborhood = criteria.neighborhoods[0].toLowerCase().replace(/\s+/g, "-")
      searchUrl += `${neighborhood}/`
    }

    console.log("🔗 MercadoLibre URL:", searchUrl)

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    })

    await delay(5000)

    // Scroll para cargar contenido
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })
    await delay(3000)

    // Hacer scroll adicional para cargar más propiedades
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await delay(4000)

    // Scroll hacia arriba y abajo para activar lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 3)
    })
    await delay(2000)

    const content = await page.content()
    const $ = cheerio.load(content)

    // Buscar elementos de propiedades en MercadoLibre
    let propertyElements = $(".ui-search-result")
    if (propertyElements.length === 0) {
      propertyElements = $(".ui-search-layout__item")
    }
    if (propertyElements.length === 0) {
      propertyElements = $(".results-item")
    }
    if (propertyElements.length === 0) {
      propertyElements = $(".andes-card")
    }

    console.log(`📋 Found ${propertyElements.length} property elements on MercadoLibre`)

    // Si no encontramos elementos específicos, buscar de forma más amplia
    if (propertyElements.length === 0) {
      console.log("🔍 Trying broader selectors for MercadoLibre...")
      propertyElements = $("div").filter((i, el) => {
        const text = $(el).text()
        return (
          text.includes("USD") &&
          text.includes("m²") &&
          text.length > 200 &&
          text.length < 2000 &&
          $(el).find("a[href]").length > 0
        )
      })
      console.log(`📋 Found ${propertyElements.length} potential property elements`)
    }

    propertyElements.slice(0, 15).each((index, element) => {
      try {
        const $el = $(element)
        const fullText = $el.text()

        // Extraer título y link
        let title = ""
        let link = ""

        const titleLinkSelectors = [
          ".ui-search-item__title a",
          ".ui-search-result__content-title a",
          "h2 a",
          ".ui-search-item__title",
          ".ui-search-result__content-title",
        ]

        for (const selector of titleLinkSelectors) {
          const titleLinkEl = $el.find(selector).first()
          if (titleLinkEl.length) {
            if (titleLinkEl.is("a")) {
              title = titleLinkEl.text().trim()
              link = titleLinkEl.attr("href") || ""
            } else {
              title = titleLinkEl.text().trim()
              const parentLink = titleLinkEl.closest("a")
              if (parentLink.length) {
                link = parentLink.attr("href") || ""
              }
            }
            if (title && link) break
          }
        }

        if (!link) {
          const anyLink = $el.find('a[href*="MLA-"], a[href*="inmuebles.mercadolibre"]').first()
          if (anyLink.length) {
            link = anyLink.attr("href") || ""
          }
        }

        // Extraer precio con validación estricta
        let totalPrice = 0
        const pricePatterns = [
          /USD\s*([\d.,]+)/gi,
          /U\$S\s*([\d.,]+)/gi,
          /\$\s*([\d.,]+)/gi,
          /([\d.,]+)\s*USD/gi,
          /([\d.,]+)\s*dólares/gi,
        ]

        for (const pattern of pricePatterns) {
          const matches = Array.from(fullText.matchAll(pattern))
          for (const match of matches) {
            if (match[1]) {
              const priceStr = match[1].replace(/[.,]/g, "")
              const parsedPrice = Number.parseInt(priceStr, 10)
              if (parsedPrice >= 80000 && parsedPrice <= 2000000) {
                totalPrice = parsedPrice
                break
              }
            }
          }
          if (totalPrice > 0) break
        }

        // Extraer superficie con validación estricta
        let surface = 0
        const surfacePatterns = [/(\d+)\s*m²/gi, /(\d+)\s*m2/gi, /superficie[:\s]*(\d+)/gi]

        for (const pattern of surfacePatterns) {
          const matches = Array.from(fullText.matchAll(pattern))
          for (const match of matches) {
            if (match[1]) {
              const surfaceValue = Number.parseInt(match[1], 10)
              if (surfaceValue >= 20 && surfaceValue <= 300) {
                surface = surfaceValue
                break
              }
            }
          }
          if (surface > 0) break
        }

        console.log(`🔍 MercadoLibre Element ${index}:`, {
          title: title.substring(0, 50),
          link: link.substring(0, 80),
          totalPrice,
          surface,
          hasValidData: !!(title && link && totalPrice > 0 && surface > 0),
        })

        // SOLO agregar si tenemos TODOS los datos válidos
        if (
          title &&
          link &&
          totalPrice > 0 &&
          surface > 0 &&
          (link.includes("inmuebles.mercadolibre.com.ar") || link.includes("MLA-"))
        ) {
          const pricePerM2 = Math.round(totalPrice / surface)

          if (pricePerM2 >= 1000 && pricePerM2 <= 8000) {
            const isOwner =
              fullText.toLowerCase().includes("dueño") ||
              fullText.toLowerCase().includes("directo") ||
              fullText.toLowerCase().includes("particular")

            const neighborhood = extractNeighborhoodFromText(title, criteria.neighborhoods || [])

            properties.push({
              id: `mercadolibre-real-${Date.now()}-${index}`,
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

            console.log(
              `✅ Added REAL MercadoLibre property: ${title.substring(0, 40)}... - $${totalPrice} (${pricePerM2}/m²)`,
            )
          }
        }
      } catch (err) {
        console.error(`Error processing MercadoLibre element ${index}:`, err)
      }
    })

    console.log(`✅ MercadoLibre: ${properties.length} REAL properties extracted`)
    return properties
  } catch (error) {
    console.error("❌ MercadoLibre real scraping error:", error)
    return []
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

function applyRealFilters(properties: Property[], criteria: any): Property[] {
  let filtered = [...properties]

  console.log(`🔍 Applying filters to ${filtered.length} REAL properties`)
  console.log(`📋 Filter criteria:`, {
    neighborhoods: criteria.neighborhoods,
    neighborhoodPrices: criteria.neighborhoodPrices,
    ownerOnly: criteria.ownerOnly,
    globalMaxPricePerM2: criteria.globalMaxPricePerM2,
  })

  // Filtrar por barrios
  if (criteria.neighborhoods?.length > 0) {
    const beforeCount = filtered.length
    filtered = filtered.filter((property) =>
      criteria.neighborhoods.some(
        (n: string) =>
          property.neighborhood.toLowerCase() === n.toLowerCase() ||
          property.title.toLowerCase().includes(n.toLowerCase()),
      ),
    )
    console.log(`🏘️ After neighborhood filter: ${filtered.length} (was ${beforeCount})`)
  }

  // Filtrar por propietario
  if (criteria.ownerOnly) {
    const beforeCount = filtered.length
    filtered = filtered.filter((property) => property.isOwner)
    console.log(`👤 After owner filter: ${filtered.length} (was ${beforeCount})`)
  }

  // Filtrar por precio por m² con lógica específica por barrio
  if (criteria.neighborhoodPrices?.length > 0 || criteria.globalMaxPricePerM2) {
    const beforeCount = filtered.length
    filtered = filtered.filter((property) => {
      // Buscar precio específico para este barrio
      const neighborhoodPrice = criteria.neighborhoodPrices?.find(
        (np: NeighborhoodPrice) => np.neighborhood.toLowerCase() === property.neighborhood.toLowerCase(),
      )

      let maxPriceForThisProperty = null

      if (neighborhoodPrice?.maxPricePerM2) {
        // Si el barrio tiene precio específico, usarlo
        maxPriceForThisProperty = neighborhoodPrice.maxPricePerM2
        console.log(`💰 Using specific price for ${property.neighborhood}: $${maxPriceForThisProperty}/m²`)
      } else if (criteria.globalMaxPricePerM2) {
        // Si no tiene precio específico, usar el global
        maxPriceForThisProperty = criteria.globalMaxPricePerM2
        console.log(`💰 Using global price for ${property.neighborhood}: $${maxPriceForThisProperty}/m²`)
      }

      if (maxPriceForThisProperty && maxPriceForThisProperty > 0) {
        const isValid = property.pricePerM2 <= maxPriceForThisProperty
        if (!isValid) {
          console.log(
            `💰 Filtered out: ${property.title.substring(0, 30)} - $${property.pricePerM2}/m² > $${maxPriceForThisProperty}/m² (${property.neighborhood})`,
          )
        }
        return isValid
      }

      // Si no hay límite de precio para este barrio, incluirlo
      return true
    })
    console.log(`💰 After price filter: ${filtered.length} (was ${beforeCount})`)
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
    } else {
      console.log(`🔄 Removed duplicate: ${property.title.substring(0, 30)}`)
    }
  }

  console.log(`🔄 After deduplication: ${uniqueProperties.length} REAL properties`)

  // Ordenar por precio por m² (más baratos primero)
  uniqueProperties.sort((a, b) => a.pricePerM2 - b.pricePerM2)

  // Log final de propiedades REALES con información de precios
  uniqueProperties.forEach((property, index) => {
    const neighborhoodPrice = criteria.neighborhoodPrices?.find(
      (np: NeighborhoodPrice) => np.neighborhood.toLowerCase() === property.neighborhood.toLowerCase(),
    )
    const priceLimit = neighborhoodPrice?.maxPricePerM2 || criteria.globalMaxPricePerM2 || "No limit"

    console.log(
      `📊 Final REAL property ${index + 1}: ${property.title.substring(0, 40)} - $${property.totalPrice} (${property.pricePerM2}/m²) - ${property.source} - ${property.neighborhood} (limit: ${priceLimit})`,
    )
  })

  return uniqueProperties
}
