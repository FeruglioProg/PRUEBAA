interface ScrapingStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  lastScrapeTime: Date
  averageResponseTime: number
  errorLog: Array<{ timestamp: Date; error: string; source: string }>
}

class ScrapingMonitor {
  private stats: ScrapingStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    lastScrapeTime: new Date(),
    averageResponseTime: 0,
    errorLog: [],
  }

  recordRequest(source: string, success: boolean, responseTime: number, error?: string) {
    this.stats.totalRequests++
    this.stats.lastScrapeTime = new Date()

    if (success) {
      this.stats.successfulRequests++
    } else {
      this.stats.failedRequests++
      if (error) {
        this.stats.errorLog.push({
          timestamp: new Date(),
          error,
          source,
        })

        // Keep only last 50 errors
        if (this.stats.errorLog.length > 50) {
          this.stats.errorLog = this.stats.errorLog.slice(-50)
        }
      }
    }

    // Update average response time
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests
  }

  getStats(): ScrapingStats {
    return { ...this.stats }
  }

  getSuccessRate(): number {
    if (this.stats.totalRequests === 0) return 0
    return (this.stats.successfulRequests / this.stats.totalRequests) * 100
  }

  reset() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastScrapeTime: new Date(),
      averageResponseTime: 0,
      errorLog: [],
    }
  }
}

export const scrapingMonitor = new ScrapingMonitor()
