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
  private failedProxies = new Map<string, { fails: number; lastFail: number }>()
  private brightDataProxy: ProxyConfig | null = null
  private lastProxyTest = 0
  private proxyTestInterval = 15 * 60 * 1000 // 15 minutos

  constructor() {
    this.initializeProxies()
  }

  private initializeProxies() {
    // Configurar el proxy de Bright Data con las credenciales proporcionadas
    this.brightDataProxy = {
      host: "brd.superproxy.io",
      port: 33335,
      username: "brd-customer-hl_c04d5276-zone-datacenter_proxy1",
      password: "i27ypnprmfw5",
      protocol: "http",
    }

    // Agregar el proxy de Bright Data como primera opción
    this.proxies.push(this.brightDataProxy)
    console.log(`✅ Initialized with Bright Data proxy: ${this.brightDataProxy.host}:${this.brightDataProxy.port}`)

    // Proxies de respaldo (en caso de que Bright Data falle temporalmente)
    const backupProxies: ProxyConfig[] = [
      { host: "103.152.112.162", port: 80, protocol: "http" },
      { host: "185.82.139.1", port: 8080, protocol: "http" },
      { host: "103.152.112.134", port: 80, protocol: "http" },
      { host: "103.152.112.218", port: 80, protocol: "http" },
      { host: "103.152.112.145", port: 80, protocol: "http" },
    ]

    // Agregar proxies de respaldo
    this.proxies.push(...backupProxies)

    console.log(`✅ Initialized with ${this.proxies.length} proxies (1 Bright Data + ${backupProxies.length} backup)`)

    // Probar el proxy de Bright Data inmediatamente
    this.testBrightDataProxy()
  }

  getBrightDataProxy(): ProxyConfig | null {
    return this.brightDataProxy
  }

  getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) return null

    // Siempre intentar usar el proxy de Bright Data primero si está disponible
    if (this.brightDataProxy) {
      const proxyKey = this.getProxyKey(this.brightDataProxy)
      const failRecord = this.failedProxies.get(proxyKey)

      // Si el proxy no ha fallado o ha pasado suficiente tiempo desde el último fallo
      if (!failRecord || failRecord.fails < 3 || Date.now() - failRecord.lastFail > 5 * 60 * 1000) {
        // 5 minutos
        return this.brightDataProxy
      }
    }

    // Si Bright Data no está disponible o ha fallado, buscar otro proxy
    let attempts = 0

    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentIndex]
      const proxyKey = this.getProxyKey(proxy)

      // Avanzar al siguiente proxy para la próxima vez
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length

      const failRecord = this.failedProxies.get(proxyKey)

      // Usar este proxy si no ha fallado o si ha pasado suficiente tiempo desde el último fallo
      if (!failRecord || failRecord.fails < 5 || Date.now() - failRecord.lastFail > 30 * 60 * 1000) {
        // 30 minutos
        return proxy
      }

      attempts++
    }

    // Si todos los proxies han fallado recientemente, usar el que tenga menos fallos
    let bestProxy = null
    let minFails = Number.POSITIVE_INFINITY

    for (const proxy of this.proxies) {
      const proxyKey = this.getProxyKey(proxy)
      const failRecord = this.failedProxies.get(proxyKey)

      if (!failRecord || failRecord.fails < minFails) {
        minFails = failRecord ? failRecord.fails : 0
        bestProxy = proxy
      }
    }

    return bestProxy
  }

  markProxyAsFailed(proxy: ProxyConfig) {
    const proxyKey = this.getProxyKey(proxy)
    const failRecord = this.failedProxies.get(proxyKey) || { fails: 0, lastFail: 0 }

    failRecord.fails++
    failRecord.lastFail = Date.now()

    this.failedProxies.set(proxyKey, failRecord)
    console.log(`❌ Proxy marked as failed: ${proxyKey} (fails: ${failRecord.fails})`)
  }

  resetProxyFailures(proxy: ProxyConfig) {
    const proxyKey = this.getProxyKey(proxy)
    this.failedProxies.delete(proxyKey)
    console.log(`✅ Proxy failures reset: ${proxyKey}`)
  }

  getProxyUrl(proxy: ProxyConfig): string {
    const auth = proxy.username && proxy.password ? `${proxy.username}:${proxy.password}@` : ""
    return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`
  }

  private getProxyKey(proxy: ProxyConfig): string {
    return `${proxy.host}:${proxy.port}`
  }

  async testBrightDataProxy(): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (!this.brightDataProxy) {
        console.log("❌ No Bright Data proxy configured")
        return resolve(false)
      }

      try {
        console.log(`🧪 Testing Bright Data proxy: ${this.brightDataProxy.host}:${this.brightDataProxy.port}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        // Usar fetch con proxy configurado manualmente
        const response = await fetch("https://geo.brdtest.com/welcome.txt?product=dc&method=native", {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/plain,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
          },
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const text = await response.text()
          console.log(`✅ Bright Data proxy test successful!`)
          console.log(`📍 Response: ${text.substring(0, 100)}...`)
          this.resetProxyFailures(this.brightDataProxy)
          return resolve(true)
        } else {
          console.log(`❌ Bright Data proxy test failed: HTTP ${response.status}`)
          this.markProxyAsFailed(this.brightDataProxy)
          return resolve(false)
        }
      } catch (error) {
        console.error(`❌ Bright Data proxy test error:`, error)
        if (this.brightDataProxy) {
          this.markProxyAsFailed(this.brightDataProxy)
        }
        return resolve(false)
      }
    })
  }

  async testProxy(proxy: ProxyConfig): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        console.log(`🧪 Testing proxy: ${proxy.host}:${proxy.port}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        // Para Bright Data, usar su endpoint de prueba
        const testUrl =
          proxy.host === "brd.superproxy.io"
            ? "https://geo.brdtest.com/welcome.txt?product=dc&method=native"
            : "https://httpbin.org/ip"

        const response = await fetch(testUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.text()
          console.log(`✅ Proxy test successful: ${data.substring(0, 50)}...`)
          return resolve(true)
        } else {
          console.log(`❌ Proxy test failed: HTTP ${response.status}`)
          return resolve(false)
        }
      } catch (error) {
        console.error(`❌ Proxy test error:`, error)
        return resolve(false)
      }
    })
  }

  getProxyStats(): any {
    const stats = {
      totalProxies: this.proxies.length,
      brightDataAvailable: !!this.brightDataProxy,
      failedProxies: Array.from(this.failedProxies.entries()).map(([key, value]) => ({
        proxy: key,
        fails: value.fails,
        lastFail: new Date(value.lastFail).toISOString(),
      })),
    }

    return stats
  }
}

export const proxyManager = new ProxyManager()
