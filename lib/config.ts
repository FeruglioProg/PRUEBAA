// Configuración simplificada sin Redis ni métricas

// Configuración de scraping
export const SCRAPING_CONFIG = {
  // Tiempo máximo para scraping en tiempo real (ms)
  TIMEOUT: 120000, // 2 minutos

  // Delay entre requests (ms)
  MIN_DELAY: 1000,
  MAX_DELAY: 3000,

  // Máximo de propiedades por fuente
  MAX_PROPERTIES_PER_SOURCE: 10,

  // Fuentes habilitadas
  SOURCES: ["Zonaprop", "Argenprop", "MercadoLibre"],

  // Usar proxy (si está configurado)
  USE_PROXY: process.env.PROXY_HOST ? true : false,
}

// Configuración de email
export const EMAIL_CONFIG = {
  ENABLED: process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD ? true : false,
  FROM: process.env.GMAIL_USER || "example@gmail.com",
}

// Versión simplificada
export const IS_SIMPLIFIED_VERSION = true
