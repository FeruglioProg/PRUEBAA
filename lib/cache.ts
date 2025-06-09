interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>()

  set(key: string, data: any, ttlMinutes = 30) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear() {
    this.cache.clear()
  }

  generateKey(criteria: any): string {
    return JSON.stringify({
      neighborhoods: criteria.neighborhoods?.sort(),
      ownerOnly: criteria.ownerOnly,
      maxPricePerM2: criteria.maxPricePerM2,
      timeRange: criteria.timeRange,
    })
  }
}

export const propertyCache = new SimpleCache()
