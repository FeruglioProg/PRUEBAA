import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker"
import type { Browser, Page } from "puppeteer"
import UserAgent from "user-agents"
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

  async initBrowser(): Promise<Browser> {
    // Si ya hay una inicialización en progreso, esperar a que termine
    if (this.isInitializing && this.initPromise) {
      return this.initPromise
    }

    // Si el navegador ya está inicializado, devolverlo
    if (this.browser) {
      return this.browser
    }

    console.log("🚀 Initializing browser...")
    this.isInitializing = true

    // Crear una promesa que podemos devolver mientras se inicializa
    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        // Obtener el proxy de Bright Data
        const brightDataProxy = proxyManager.getBrightDataProxy()

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
            "--use-mock-keychain",
          ],
        }

        // Configurar proxy de Bright Data
        if (brightDataProxy) {
          const proxyUrl = proxyManager.getProxyUrl(brightDataProxy)
          launchOptions.args.push(`--proxy-server=${proxyUrl}`)
          console.log(`🔗 Using Bright Data proxy: ${brightDataProxy.host}:${brightDataProxy.port}`)
        }

        this.browser = await puppeteer.launch(launchOptions)
        console.log("✅ Browser initialized successfully")

        // Si estamos usando Bright Data, configurar autenticación
        if (brightDataProxy?.username && brightDataProxy?.password) {
          const page = await this.browser.newPage()
          await page.authenticate({
            username: brightDataProxy.username,
            password: brightDataProxy.password,
          })
          await page.close()
          console.log("✅ Proxy authentication configured")
        }

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
    return page
  }

  private async configurePage(page: Page): Promise<void> {
    // Configurar User-Agent aleatorio
    const userAgent = new UserAgent({ deviceCategory: "desktop" })
    await page.setUserAgent(userAgent.toString())

    // Configurar viewport aleatorio
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
    ]
    const viewport = viewports[Math.floor(Math.random() * viewports.length)]
    await page.setViewport(viewport)

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

    // Interceptar requests para optimizar
    await page.setRequestInterception(true)
    page.on("request", (request) => {
      const resourceType = request.resourceType()

      // Bloquear recursos innecesarios
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        request.abort()
      } else {
        request.continue()
      }
    })

    // Manejar diálogos
    page.on("dialog", async (dialog) => {
      await dialog.dismiss()
    })

    // Configurar timeouts
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(30000)
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.pages = []
      console.log("🔒 Browser closed")
    }
  }

  async randomDelay(min = 1000, max = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
}

export const browserManager = new BrowserManager()
