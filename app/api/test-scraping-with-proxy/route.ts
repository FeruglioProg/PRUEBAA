import { NextResponse } from "next/server"
import { browserManager } from "@/lib/browser-manager"
import { proxyManager } from "@/lib/proxy-manager"

export async function POST() {
  try {
    console.log("🧪 Testing real scraping with Bright Data proxy...")

    // Test 1: Verificar proxy
    const proxyTest = await proxyManager.testBrightDataProxy()
    console.log(`📡 Proxy test: ${proxyTest ? "✅ PASS" : "❌ FAIL"}`)

    // Test 2: Probar navegación básica
    const page = await browserManager.getPage()

    console.log("🌐 Testing basic navigation...")
    await page.goto("https://httpbin.org/ip", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    })

    const ipInfo = await page.content()
    console.log("📍 IP Info:", ipInfo.substring(0, 200))

    // Test 3: Probar un sitio de propiedades real (sin scraping intensivo)
    console.log("🏠 Testing property site access...")

    let siteTest = false
    try {
      await page.goto("https://www.zonaprop.com.ar", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      })

      const title = await page.title()
      const content = await page.evaluate(() => document.body.innerText.substring(0, 500))

      console.log(`📄 Site title: "${title}"`)
      console.log(`📄 Content preview: ${content.substring(0, 200)}...`)

      siteTest = title.toLowerCase().includes("zonaprop") || content.toLowerCase().includes("propiedades")
    } catch (siteError) {
      console.error("❌ Site test error:", siteError.message)
    }

    // Test 4: Verificar que no estamos bloqueados
    const isBlocked = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase()
      return (
        text.includes("blocked") || text.includes("captcha") || text.includes("robot") || text.includes("access denied")
      )
    })

    return NextResponse.json({
      success: true,
      tests: {
        proxyConnection: proxyTest,
        basicNavigation: ipInfo.includes("origin"),
        siteAccess: siteTest,
        notBlocked: !isBlocked,
      },
      details: {
        ipResponse: ipInfo.substring(0, 300),
        userAgent: await page.evaluate(() => navigator.userAgent),
        currentUrl: page.url(),
      },
      recommendations: generateScrapingRecommendations(proxyTest, siteTest, isBlocked),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Scraping test error:", error)

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

function generateScrapingRecommendations(proxyTest: boolean, siteTest: boolean, isBlocked: boolean): string[] {
  const recommendations = []

  if (!proxyTest) {
    recommendations.push("❌ Proxy connection failed - check Bright Data credentials")
  } else {
    recommendations.push("✅ Proxy connection working")
  }

  if (!siteTest) {
    recommendations.push("⚠️ Property site access failed - may need different approach")
  } else {
    recommendations.push("✅ Property site accessible")
  }

  if (isBlocked) {
    recommendations.push("🚫 Detection systems may be blocking - consider rotating user agents")
  } else {
    recommendations.push("✅ No blocking detected")
  }

  if (proxyTest && siteTest && !isBlocked) {
    recommendations.push("🚀 Ready for real property scraping!")
  }

  return recommendations
}
