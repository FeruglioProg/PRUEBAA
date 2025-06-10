import { NextResponse } from "next/server"
import { proxyManager } from "@/lib/proxy-manager"
import { browserManager } from "@/lib/browser-manager"

export async function GET() {
  try {
    console.log("🧪 Testing Bright Data proxy...")

    // Check if proxy is configured
    if (!proxyManager.isConfigured()) {
      return NextResponse.json({
        success: false,
        message: "Proxy not configured",
        directProxyTest: {
          success: false,
        },
        browserTest: {
          success: false,
          userAgent: "Not available",
          testUrl: "Not available",
        },
        brightDataProxy: null,
        timestamp: new Date().toISOString(),
      })
    }

    // Test directo del proxy
    const proxyTestResult = await proxyManager.testBrightDataProxy()

    // Test con Puppeteer
    let browserTestResult = false
    let userAgent = ""
    let testUrl = ""

    try {
      const page = await browserManager.getPage()
      await page.goto("https://geo.brdtest.com/welcome.txt?product=dc&method=native", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      })

      const content = await page.content()
      userAgent = await page.evaluate(() => navigator.userAgent)
      testUrl = page.url()
      browserTestResult = content.includes("welcome") || content.includes("success")
    } catch (error) {
      console.error("Browser test error:", error)
    }

    return NextResponse.json({
      success: true,
      directProxyTest: {
        success: proxyTestResult,
      },
      browserTest: {
        success: browserTestResult,
        userAgent,
        testUrl,
      },
      brightDataProxy: proxyManager.getBrightDataProxy(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Proxy test error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
