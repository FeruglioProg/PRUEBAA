const { PrismaClient } = require("@prisma/client")
const { createClient } = require("redis")
const express = require("express")
const client = require("prom-client")

// Inicializar clientes
const prisma = new PrismaClient()
const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})

// Configurar métricas
const register = new client.Registry()
client.collectDefaultMetrics({ register })

const scrapingJobsTotal = new client.Counter({
  name: "scraping_jobs_total",
  help: "Total number of scraping jobs processed",
  labelNames: ["status"],
})

const scrapingJobDuration = new client.Histogram({
  name: "scraping_job_duration_seconds",
  help: "Duration of scraping jobs in seconds",
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
})

const propertiesScraped = new client.Counter({
  name: "properties_scraped_total",
  help: "Total number of properties scraped",
  labelNames: ["source"],
})

register.registerMetric(scrapingJobsTotal)
register.registerMetric(scrapingJobDuration)
register.registerMetric(propertiesScraped)

// Servidor de métricas
const app = express()
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType)
  res.end(await register.metrics())
})

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() })
})

const metricsPort = process.env.METRICS_PORT || 3001
app.listen(metricsPort, () => {
  console.log(`📊 Metrics server listening on port ${metricsPort}`)
})

// Configuración del worker
const QUEUE_NAME = "scraping_jobs"
const POLL_INTERVAL = 5000
const MAX_CONCURRENT_JOBS = 2

let activeJobs = 0
let isConnected = false

// Conectar a Redis
async function connect() {
  try {
    await redis.connect()
    console.log("✅ Connected to Redis")
    isConnected = true
  } catch (error) {
    console.error("❌ Redis connection error:", error)
    setTimeout(connect, 5000)
  }
}

// Simulador de scraping avanzado (reemplaza el scraping real para evitar bloqueos)
async function simulateAdvancedScraping(criteria) {
  console.log("🔍 Simulating advanced scraping with criteria:", criteria)

  // Simular tiempo de scraping real
  await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 5000))

  const { neighborhoods = [], ownerOnly = false, maxPricePerM2 } = criteria

  // Base de datos de propiedades simuladas más extensa
  const allProperties = [
    // PALERMO
    {
      id: `scraped-palermo-${Date.now()}-1`,
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
      id: `scraped-palermo-${Date.now()}-2`,
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
      id: `scraped-palermo-${Date.now()}-3`,
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
      id: `scraped-belgrano-${Date.now()}-1`,
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
      id: `scraped-belgrano-${Date.now()}-2`,
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
      id: `scraped-recoleta-${Date.now()}-1`,
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
      id: `scraped-recoleta-${Date.now()}-2`,
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
      id: `scraped-villacrespo-${Date.now()}-1`,
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
      id: `scraped-santelmo-${Date.now()}-1`,
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
      id: `scraped-caballito-${Date.now()}-1`,
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
      id: `scraped-flores-${Date.now()}-1`,
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
  ]

  // Aplicar filtros
  let filtered = [...allProperties]

  // Filtrar por barrios
  if (neighborhoods.length > 0) {
    filtered = filtered.filter((property) =>
      neighborhoods.some(
        (n) =>
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

  console.log(`✅ Simulated scraping completed: ${results.length} properties found`)
  return results
}

// Procesar trabajo de scraping
async function processJob(jobId) {
  const startTime = Date.now()
  console.log(`🚀 Processing job: ${jobId}`)

  try {
    // Actualizar estado del trabajo
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: "processing",
        started_at: new Date(),
      },
    })

    // Obtener criterios del trabajo
    const job = await prisma.scrapingJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    // Realizar scraping simulado
    console.log(`🔍 Starting scraping with criteria:`, job.criteria)
    const properties = await simulateAdvancedScraping(job.criteria)

    // Guardar propiedades en la base de datos
    const savedPropertyIds = []
    for (const property of properties) {
      try {
        await prisma.property.upsert({
          where: { id: property.id },
          update: {
            title: property.title,
            link: property.link,
            total_price: property.totalPrice,
            surface: property.surface,
            price_per_m2: property.pricePerM2,
            source: property.source,
            neighborhood: property.neighborhood,
            is_owner: property.isOwner,
            published_date: property.publishedDate,
            updated_at: new Date(),
          },
          create: {
            id: property.id,
            title: property.title,
            link: property.link,
            total_price: property.totalPrice,
            surface: property.surface,
            price_per_m2: property.pricePerM2,
            source: property.source,
            neighborhood: property.neighborhood,
            is_owner: property.isOwner,
            published_date: property.publishedDate,
          },
        })

        savedPropertyIds.push(property.id)

        // Actualizar métricas
        propertiesScraped.inc({ source: property.source })
      } catch (dbError) {
        console.error(`Error saving property ${property.id}:`, dbError)
      }
    }

    // Actualizar trabajo como completado
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        result: { properties: savedPropertyIds },
        completed_at: new Date(),
      },
    })

    // Actualizar métricas
    const duration = (Date.now() - startTime) / 1000
    scrapingJobsTotal.inc({ status: "completed" })
    scrapingJobDuration.observe(duration)

    console.log(`✅ Job ${jobId} completed successfully in ${duration}s`)
  } catch (error) {
    console.error(`❌ Error processing job ${jobId}:`, error)

    // Actualizar trabajo como fallido
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        error: error.message,
        completed_at: new Date(),
      },
    })

    // Actualizar métricas
    scrapingJobsTotal.inc({ status: "failed" })
  } finally {
    activeJobs--
  }
}

// Verificar y procesar trabajos pendientes
async function pollQueue() {
  if (!isConnected) return

  try {
    // Verificar si podemos procesar más trabajos
    if (activeJobs >= MAX_CONCURRENT_JOBS) {
      return
    }

    // Obtener trabajo de la cola
    const jobId = await redis.lPop(QUEUE_NAME)

    if (jobId) {
      activeJobs++
      processJob(jobId).catch(console.error)
    }
  } catch (error) {
    console.error("❌ Error polling queue:", error)
  } finally {
    // Programar siguiente verificación
    setTimeout(pollQueue, POLL_INTERVAL)
  }
}

// Iniciar worker
async function start() {
  console.log("🚀 Starting scraper worker...")

  try {
    // Conectar a Redis
    await connect()

    // Iniciar polling de la cola
    pollQueue()

    console.log("✅ Worker started successfully")

    // Configurar manejo de señales para cierre limpio
    process.on("SIGTERM", shutdown)
    process.on("SIGINT", shutdown)
  } catch (error) {
    console.error("❌ Failed to start worker:", error)
    process.exit(1)
  }
}

// Cierre limpio
async function shutdown() {
  console.log("🛑 Shutting down worker...")

  try {
    // Cerrar conexiones
    await redis.quit()
    await prisma.$disconnect()

    console.log("✅ Worker shut down successfully")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error during shutdown:", error)
    process.exit(1)
  }
}

// Iniciar worker
start().catch(console.error)
