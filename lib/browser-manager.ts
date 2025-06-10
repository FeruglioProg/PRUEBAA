import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker"
import type { Browser, Page } from "puppeteer"
import { proxyManager } from "./proxy-manager"

// Configurar plugins
puppeteer.use(StealthPlugin())
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

class BrowserManager {
  private browser: Browser | null = null
  private pages: Page[] = []
  private maxPages = 3
  private isInitializing = false
  private initPromise: Promise<Browser> | null = null
  private lastProxyChange = 0
  private proxyRotationInterval = 30 * 60 * 1000 // 30 minutos

  async initBrowser(forceNewBrowser = false): Promise<Browser> {
    // Si se solicita un nuevo navegador, cerrar el actual
    if (forceNewBrowser && this.browser) {
      await this.closeBrowser()
    }

    // Si ya hay una inicialización en progreso, esperar a que termine
    if (this.isInitializing && this.initPromise) {
      return this.initPromise
    }

    // Si el navegador ya está inicializado, verificar si necesitamos rotar el proxy
    if (this.browser) {
      const now = Date.now()
      if (now - this.lastProxyChange < this.proxyRotationInterval) {
        return this.browser
      }

      // Tiempo de rotar proxy
      console.log("🔄 Time to rotate proxy, restarting browser...")
      await this.closeBrowser()
    }

    console.log("🚀 Initializing browser with Bright Data proxy...")
    this.isInitializing = true

    // Crear una promesa que podemos devolver mientras se inicializa
    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        // Obtener el proxy de Bright Data
        const proxy = proxyManager.getBrightDataProxy()
        this.lastProxyChange = Date.now()

        const launchOptions: any = {
          headless: "new",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-field-trial-config",
            "--disable-back-forward-cache",
            "--disable-hang-monitor",
            "--disable-ipc-flooding-protection",
            "--disable-prompt-on-repost",
            "--disable-sync",
            "--force-color-profile=srgb",
            "--metrics-recording-only",
            "--use-mock-keychain",
            "--enable-automation",
            "--password-store=basic",
            "--window-size=1920,1080",
            "--lang=es-AR,es",
            "--disable-blink-features=AutomationControlled",
            "--disable-extensions",
            "--disable-plugins",
            "--disable-images",
            // Configuraciones específicas para proxies
            "--ignore-certificate-errors",
            "--ignore-ssl-errors",
            "--ignore-certificate-errors-spki-list",
            "--disable-features=VizDisplayCompositor",
            "--proxy-bypass-list=<-loopback>",
          ],
          ignoreHTTPSErrors: true,
          ignoreDefaultArgs: ["--disable-extensions"],
          defaultViewport: {
            width: 1920,
            height: 1080,
          },
        }

        // Configurar proxy de Bright Data
        if (proxy) {
          launchOptions.args.push(`--proxy-server=${proxy.protocol}://${proxy.host}:${proxy.port}`)
          console.log(`🔗 Using Bright Data proxy: ${proxy.host}:${proxy.port}`)
        } else {
          console.log("⚠️ No Bright Data proxy available, using direct connection")
        }

        this.browser = await puppeteer.launch(launchOptions)
        console.log("✅ Browser initialized successfully")

        // Configurar autenticación del proxy de Bright Data
        if (proxy?.username && proxy?.password) {
          const page = await this.browser.newPage()
          await page.authenticate({
            username: proxy.username,
            password: proxy.password,
          })
          await page.close()
          console.log("✅ Bright Data proxy authentication configured")
        }

        // Configurar manejo de cierre
        this.browser.on("disconnected", () => {
          console.log("⚠️ Browser disconnected")
          this.browser = null
          this.pages = []
        })

        resolve(this.browser)
      } catch (error) {
        console.error("❌ Failed to initialize browser:", error)
        this.isInitializing = false
        this.initPromise = null
        reject(error)
      }
    })

    try {
      const browser = await this.initPromise
      this.isInitializing = false
      return browser
    } catch (error) {
      this.isInitializing = false
      throw error
    }
  }

  async getPage(): Promise<Page> {
    const browser = await this.initBrowser()

    if (this.pages.length < this.maxPages) {
      const page = await browser.newPage()
      await this.configurePage(page)
      this.pages.push(page)
      return page
    }

    // Reutilizar página existente
    const page = this.pages[Math.floor(Math.random() * this.pages.length)]

    // Limpiar cookies y almacenamiento para evitar problemas
    try {
      await page.deleteCookie(...(await page.cookies()))
      const client = await page.target().createCDPSession()
      await client.send("Network.clearBrowserCookies")
      await client.send("Network.clearBrowserCache")
    } catch (error) {
      console.log("Warning: Could not clear browser data:", error.message)
    }

    return page
  }

  private async configurePage(page: Page): Promise<void> {
    // Configurar User-Agent realista
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    await page.setUserAgent(userAgent)

    // Configurar viewport
    await page.setViewport({
      width: 1920,
      height: 1080,
    })

    // Configurar headers adicionales
    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Cache-Control": "max-age=0",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      "sec-ch-ua": `"Google Chrome";v="120", "Chromium";v="120", "Not?A_Brand";v="24"`,
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": `"Windows"`,
    })

    // Configurar evasión de detección avanzada
    await page.evaluateOnNewDocument(() => {
      // Ocultar webdriver
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      })

      // Ocultar automation
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise
      delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol

      // Configurar Chrome
      ;(window as any).chrome = {
        runtime: {},
        loadTimes: () => {},
        csi: () => {},
        app: {},
      }

      // Configurar plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [
          {
            0: {
              type: "application/x-google-chrome-pdf",
              suffixes: "pdf",
              description: "Portable Document Format",
            },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin",
          },
        ],
      })

      // Configurar lenguajes
      Object.defineProperty(navigator, "languages", {
        get: () => ["es-AR", "es", "en-US", "en"],
      })

      // Configurar permisos
      const originalQuery = window.navigator.permissions.query
      window.navigator.permissions.query = (parameters) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: Notification.permission } as any)
          : originalQuery(parameters)
    })

    // Interceptar requests para optimizar y evitar detección
    await page.setRequestInterception(true)
    page.on("request", (request) => {
      const resourceType = request.resourceType()
      const url = request.url()

      // Bloquear recursos innecesarios para acelerar el scraping
      if (
        resourceType === "image" ||
        resourceType === "font" ||
        resourceType === "media" ||
        url.includes("google-analytics") ||
        url.includes("googletagmanager") ||
        url.includes("facebook") ||
        url.includes("analytics") ||
        url.includes("tracker") ||
        url.includes("advertisement") ||
        url.includes("ads") ||
        url.includes("doubleclick") ||
        url.includes("googlesyndication")
      ) {
        request.abort()
      } else {
        request.continue()
      }
    })

    // Manejar diálogos automáticamente
    page.on("dialog", async (dialog) => {
      await dialog.dismiss()
    })

    // Configurar timeouts generosos
    page.setDefaultTimeout(60000)
    page.setDefaultNavigationTimeout(60000)
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close()
      } catch (error) {
        console.error("Error closing browser:", error)
      } finally {
        this.browser = null
        this.pages = []
        console.log("🔒 Browser closed")
      }
    }
  }

  async randomDelay(min = 1000, max = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  async testBrowserWithProxy(): Promise<boolean> {
    try {
      const page = await this.getPage()

      console.log("🧪 Testing browser with Bright Data proxy...")

      // Usar un endpoint más simple para la prueba
      await page.goto("https://httpbin.org/ip", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      })

      const content = await page.content()
      console.log(`📄 Content preview: ${content.substring(0, 200)}...`)

      // Verificar que obtuvimos una respuesta válida
      const success = content.includes("origin") || content.includes("ip") || content.includes("{")

      if (success) {
        console.log("✅ Browser proxy test successful!")

        // Intentar también el endpoint específico de Bright Data
        try {
          await page.goto("https://geo.brdtest.com/welcome.txt", {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          })
          const brdContent = await page.content()
          console.log(`📍 Bright Data test: ${brdContent.substring(0, 100)}...`)
        } catch (brdError) {
          console.log("⚠️ Bright Data specific test failed, but basic proxy works")
        }
      } else {
        console.log("❌ Browser proxy test failed - unexpected content")
      }

      return success
    } catch (error) {
      console.error("❌ Browser proxy test error:", error)
      return false
    }
  }
}

export const browserManager = new BrowserManager()
