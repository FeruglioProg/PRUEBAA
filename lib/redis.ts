import { createClient } from "redis"

// Cliente Redis para colas y caché
let redisClient: ReturnType<typeof createClient> | null = null

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    })

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err)
    })

    await redisClient.connect()
  }

  return redisClient
}

// Cerrar cliente Redis al finalizar
process.on("SIGTERM", async () => {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
})
