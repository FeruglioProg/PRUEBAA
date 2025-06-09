interface ProxyConfig {
  host: string
  port: number
  username?: string
  password?: string
  protocol: "http" | "https" | "socks5"
}

class ProxyManager {
  private proxies: ProxyConfig[] = []
  private currentIndex = 0
  private failedProxies = new Set<string>()
  private brightDataProxy: ProxyConfig | null = null

  constructor() {
    this.initializeProxies()
  }

  private initializeProxies() {
    // Configurar el proxy de Bright Data como proxy principal
    this.brightDataProxy = {
      host: "brd.superproxy.io",
      port: 33335,
      username: "brd-customer-hl_c04d5276-zone-datacenter_proxy1",
      password: "i27ypnprmfw5",
      protocol: "http",
    }

    // Agregar el proxy de Bright Data como primera opción
    this.proxies.push(this.brightDataProxy)

    // Proxies de respaldo (en caso de que Bright Data falle)
    const backupProxies: ProxyConfig[] = [
      { host: "8.210.83.33", port: 80, protocol: "http" },
      { host: "47.74.152.29", port: 8888, protocol: "http" },
      { host: "103.149.162.194", port: 80, protocol: "http" },
      { host: "185.199.84.161", port: 53281, protocol: "http" },
    ]

    // Agregar proxies de respaldo
    this.proxies.push(...backupProxies)

    console.log(`✅ Initialized with Bright Data proxy and ${backupProxies.length} backup proxies`)
  }

  getBrightDataProxy(): ProxyConfig | null {
    return this.brightDataProxy
  }

  getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) return null

    // Siempre intentar usar el proxy de Bright Data primero
    if (this.brightDataProxy && !this.failedProxies.has(this.getProxyKey(this.brightDataProxy))) {
      return this.brightDataProxy
    }

    let attempts = 0
    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentIndex]
      const proxyKey = this.getProxyKey(proxy)

      this.currentIndex = (this.currentIndex + 1) % this.proxies.length

      if (!this.failedProxies.has(proxyKey)) {
        return proxy
      }

      attempts++
    }

    // Si todos los proxies fallaron, resetear y intentar de nuevo
    this.failedProxies.clear()
    return this.proxies[0] || null
  }

  markProxyAsFailed(proxy: ProxyConfig) {
    const proxyKey = this.getProxyKey(proxy)
    this.failedProxies.add(proxyKey)
    console.log(`❌ Proxy marked as failed: ${proxyKey}`)
  }

  getProxyUrl(proxy: ProxyConfig): string {
    const auth = proxy.username && proxy.password ? `${proxy.username}:${proxy.password}@` : ""
    return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`
  }

  private getProxyKey(proxy: ProxyConfig): string {
    return `${proxy.host}:${proxy.port}`
  }

  testBrightDataProxy(): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (!this.brightDataProxy) {
        console.log("❌ No Bright Data proxy configured")
        return resolve(false)
      }

      try {
        const proxyUrl = this.getProxyUrl(this.brightDataProxy)
        console.log(`🧪 Testing Bright Data proxy: ${this.brightDataProxy.host}:${this.brightDataProxy.port}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch("https://geo.brdtest.com/welcome.txt?product=dc&method=native", {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const text = await response.text()
          console.log(`✅ Bright Data proxy test successful: ${text.substring(0, 50)}...`)
          return resolve(true)
        } else {
          console.log(`❌ Bright Data proxy test failed: HTTP ${response.status}`)
          return resolve(false)
        }
      } catch (error) {
        console.error(`❌ Bright Data proxy test error:`, error)
        return resolve(false)
      }
    })
  }
}

export const proxyManager = new ProxyManager()
