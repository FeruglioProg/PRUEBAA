const express = require("express")
const client = require("prom-client")

// Crear servidor Express para métricas
const app = express()
const port = process.env.METRICS_PORT || 3001

// Crear registro de métricas
const register = new client.Registry()

// Añadir métricas por defecto
client.collectDefaultMetrics({ register })

// Métricas personalizadas
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

const activeScrapingJobs = new client.Gauge({
  name: "active_scraping_jobs",
  help: "Number of currently active scraping jobs",
})

// Registrar métricas
register.registerMetric(scrapingJobsTotal)
register.registerMetric(scrapingJobDuration)
register.registerMetric(propertiesScraped)
register.registerMetric(activeScrapingJobs)

// Endpoint para métricas
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType)
  res.end(await register.metrics())
})

// Iniciar servidor
app.listen(port, () => {
  console.log(`Metrics server listening on port ${port}`)
})

module.exports = {
  scrapingJobsTotal,
  scrapingJobDuration,
  propertiesScraped,
  activeScrapingJobs,
}
