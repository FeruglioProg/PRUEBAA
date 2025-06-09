import { NextResponse } from "next/server"
import { browserManager } from "@/lib/browser-manager"
import { proxyManager } from "@/lib/proxy-manager"

export async function GET() {
  try {
    const proxy = proxyManager.getNextProxy()

    // Test básico del browser
    const page = await browserManager.getPage()
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const viewport = await page.viewport()

    return NextResponse.json({
      status: "healthy",
      browser: {
        userAgent,
        viewport,
        url: page.url(),
      },
      proxy: proxy
        ? {
            host: proxy.host,
            port: proxy.port,
            protocol: proxy.protocol,
          }
        : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
