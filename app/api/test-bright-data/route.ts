import { NextResponse } from "next/server"
import { proxyManager } from "@/lib/proxy-manager"
import { browserManager } from "@/lib/browser-manager"

export async function GET() {
  try {
    console.log("🧪 Testing Bright Data proxy configuration...")

    // Test 1: Probar el proxy directamente
    const directProxyTest = await proxyManager.testBrightDataProxy()

    // Test 2: Probar el navegador con proxy
    const browserProxyTest = await browserManager.testBrowserWithProxy()

    // Test 3: Obtener estadísticas del proxy
    const proxyStats = proxyManager.getProxyStats()

    // Test 4: Obtener información del proxy actual
    const currentProxy = proxyManager.getBrightDataProxy()

    return NextResponse.json({
      success: true,
      tests: {
        directProxy: {
          success: directProxyTest,
          description: "Direct proxy connection test",
        },
        browserProxy: {
          success: browserProxyTest,
          description: "Browser with proxy test",
        },
      },
      proxyInfo: {
        host: currentProxy?.host,
        port: currentProxy?.port,
        username: currentProxy?.username ? "***configured***" : "not configured",
        protocol: currentProxy?.protocol,
      },
      stats: proxyStats,
      timestamp: new Date().toISOString(),
      recommendations: generateRecommendations(directProxyTest, browserProxyTest),
    })
  } catch (error) {
    console.error("Bright Data test error:", error)

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

function generateRecommendations(directTest: boolean, browserTest: boolean): string[] {
  const recommendations = []

  if (!directTest && !browserTest) {
    recommendations.push("❌ Both tests failed. Check your Bright Data credentials and network connection.")
    recommendations.push("🔧 Verify that the proxy credentials are correct in the code.")
    recommendations.push("🌐 Check if your IP is whitelisted in Bright Data dashboard.")
  } else if (directTest && !browserTest) {
    recommendations.push("⚠️ Direct proxy works but browser test failed.")
    recommendations.push("🔧 This might be a browser configuration issue.")
    recommendations.push("🔄 Try restarting the browser instance.")
  } else if (!directTest && browserTest) {
    recommendations.push("⚠️ Browser test works but direct proxy failed.")
    recommendations.push("🔧 This is unusual - check the direct proxy implementation.")
  } else {
    recommendations.push("✅ All tests passed! Bright Data proxy is working correctly.")
    recommendations.push("🚀 You can now use real scraping with confidence.")
  }

  return recommendations
}
