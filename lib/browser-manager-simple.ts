import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker"
import type { Browser, Page } from "puppeteer"

// Configurar plugins
puppeteer.use(StealthPlugin())
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

class SimpleBrowserManager {
  private browser: Browser | null = null
  private pages: Page[] = []
  private maxPages = 2
  private isInitializing = false

  async initBrowser(): Promise<Browser> {
    if (this.browser && !this.browser.isConnected()) {
      this.browser = null
    }

    if (this.browser) {
      return this.browser
    }

    if (this.isInitializing) {
      // Esperar a que termine la inicialización
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      return this.browser!
    }

    console.log("🚀 Initializing browser for local development...")
    this.isInitializing = true

    try {
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
          "--window-size=1366,768",
          "--lang=es-AR,es",
          "--disable-blink-features=AutomationControlled",
          "--disable-extensions",
          "--disable-plugins",
          // Configuraciones para evitar detección
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ],
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ["--disable-extensions"],
        defaultViewport: {
          width: 1366,
          height: 768,
        },
      }

      // Solo usar proxy si está configurado Y las credenciales están disponibles
      const useProxy = process.env.PROXY_HOST && process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD

      if (useProxy) {
        console.log(`🔗 Using proxy: ${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`)
        launchOptions.args.push(
          `--proxy-server=${process.env.PROXY_PROTOCOL || "http"}://${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`,
        )
      } else {
        console.log("🌐 Using direct connection (no proxy)")
      }

      this.browser = await puppeteer.launch(launchOptions)
      console.log("✅ Browser initialized successfully")

      // Configurar autenticación del proxy si está disponible
      if (useProxy) {
        try {
          const page = await this.browser.newPage()
          await page.authenticate({
            username: process.env.PROXY_USERNAME!,
            password: process.env.PROXY_PASSWORD!,
          })
          await page.close()
          console.log("✅ Proxy authentication configured")
        } catch (authError) {
          console.error("❌ Proxy authentication failed:", authError)
          // Continuar sin proxy
        }
      }

      // Configurar manejo de cierre
      this.browser.on("disconnected", () => {
        console.log("⚠️ Browser disconnected")
        this.browser = null
        this.pages = []
      })

      this.isInitializing = false
      return this.browser
    } catch (error) {
      console.error("❌ Failed to initialize browser:", error)
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
    const page = this.pages[0]

    // Limpiar página para reutilización
    try {
      await page.deleteCookie(...(await page.cookies()))
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
    } catch (error) {
      console.log("Warning: Could not clear page data:", error.message)
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
      width: 1366,
      height: 768,
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
    })

    // Configurar evasión de detección
    await page.evaluateOnNewDocument(() => {
      // Ocultar webdriver
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      })

      // Configurar Chrome
      ;(window as any).chrome = {
        runtime: {},
        loadTimes: () => {},
        csi: () => {},
        app: {},
      }

      // Configurar plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      })

      // Configurar lenguajes
      Object.defineProperty(navigator, "languages", {
        get: () => ["es-AR", "es", "en-US", "en"],
      })
    })

    // Interceptar requests para optimizar
    await page.setRequestInterception(true)
    page.on("request", (request) => {
      const resourceType = request.resourceType()
      const url = request.url()

      // Bloquear recursos innecesarios
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
        url.includes("doubleclick")
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

    // Configurar timeouts
    page.setDefaultTimeout(45000)
    page.setDefaultNavigationTimeout(45000)
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
}

export const simpleBrowserManager = new SimpleBrowserManager()
