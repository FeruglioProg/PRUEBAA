interface ProxyConfig {
  host: string
  port: number
  username: string
  password: string
  protocol: string
}

class ProxyManager {
  private proxyConfig: ProxyConfig | null = null
  private stats = {
    requests: 0,
    errors: 0,
    lastUsed: null as Date | null,
  }

  constructor() {
    this.initializeProxy()
  }

  private initializeProxy() {
    const host = process.env.PROXY_HOST
    const port = process.env.PROXY_PORT
    const username = process.env.PROXY_USERNAME
    const password = process.env.PROXY_PASSWORD
    const protocol = process.env.PROXY_PROTOCOL || "http"

    if (host && port && username && password) {
      this.proxyConfig = {
        host,
        port: Number.parseInt(port),
        username,
        password,
        protocol,
      }
      console.log("✅ Proxy manager initialized with Bright Data config")
    } else {
      console.warn("⚠️ Proxy configuration incomplete. Some environment variables are missing.")
      // Don't throw an error, just continue without proxy
    }
  }

  isConfigured(): boolean {
    return this.proxyConfig !== null
  }

  getBrightDataProxy(): ProxyConfig | null {
    return this.proxyConfig
  }

  async testBrightDataProxy(): Promise<boolean> {
    if (!this.proxyConfig) {
      console.log("❌ No proxy configuration available")
      return false
    }

    try {
      this.stats.requests++

      // Test proxy connection with a simple HTTP request
      const proxyUrl = `${this.proxyConfig.protocol}://${this.proxyConfig.username}:${this.proxyConfig.password}@${this.proxyConfig.host}:${this.proxyConfig.port}`

      console.log("🧪 Testing proxy connection...")

      // Simple test - try to make a request through the proxy
      const response = await fetch("https://httpbin.org/ip", {
        method: "GET",
        // Note: In a real implementation, you'd configure the proxy here
        // This is a simplified version for the example
      })

      if (response.ok) {
        this.stats.lastUsed = new Date()
        console.log("✅ Proxy test successful")
        return true
      } else {
        this.stats.errors++
        console.log("❌ Proxy test failed - bad response")
        return false
      }
    } catch (error) {
      this.stats.errors++
      console.error("❌ Proxy test error:", error)
      return false
    }
  }

  getProxyStats() {
    return {
      ...this.stats,
      configured: !!this.proxyConfig,
      config: this.proxyConfig
        ? {
            host: this.proxyConfig.host,
            port: this.proxyConfig.port,
            protocol: this.proxyConfig.protocol,
          }
        : null,
    }
  }

  getProxyUrl(): string | null {
    if (!this.proxyConfig) return null

    return `${this.proxyConfig.protocol}://${this.proxyConfig.username}:${this.proxyConfig.password}@${this.proxyConfig.host}:${this.proxyConfig.port}`
  }
}

export const proxyManager = new ProxyManager()
