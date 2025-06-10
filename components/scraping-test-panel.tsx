"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Play } from "lucide-react"

interface ScrapingTestResult {
  success: boolean
  tests: {
    proxyConnection: boolean
    basicNavigation: boolean
    siteAccess: boolean
    notBlocked: boolean
  }
  details: {
    ipResponse: string
    userAgent: string
    currentUrl: string
  }
  recommendations: string[]
}

export function ScrapingTestPanel() {
  const [result, setResult] = useState<ScrapingTestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-scraping-with-proxy", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Test failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTestIcon = (passed: boolean) => {
    return passed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getOverallStatus = () => {
    if (!result) return { status: "unknown", color: "secondary" }

    const { tests } = result
    const passedTests = Object.values(tests).filter(Boolean).length
    const totalTests = Object.values(tests).length

    if (passedTests === totalTests) {
      return { status: "All tests passed", color: "default" }
    } else if (passedTests >= totalTests / 2) {
      return { status: "Partially working", color: "secondary" }
    } else {
      return { status: "Issues detected", color: "destructive" }
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Scraping Test with Bright Data
          {result && <Badge variant={getOverallStatus().color as any}>{getOverallStatus().status}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={runTest} disabled={loading} className="w-full">
            {loading ? "Running Tests..." : "🧪 Run Scraping Test"}
          </Button>

          {result && (
            <>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">Proxy Connection</span>
                  <div className="flex items-center gap-2">
                    {getTestIcon(result.tests.proxyConnection)}
                    <span className="text-xs">{result.tests.proxyConnection ? "Connected" : "Failed"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">Basic Navigation</span>
                  <div className="flex items-center gap-2">
                    {getTestIcon(result.tests.basicNavigation)}
                    <span className="text-xs">{result.tests.basicNavigation ? "Working" : "Failed"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">Property Site Access</span>
                  <div className="flex items-center gap-2">
                    {getTestIcon(result.tests.siteAccess)}
                    <span className="text-xs">{result.tests.siteAccess ? "Accessible" : "Blocked"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">Not Blocked</span>
                  <div className="flex items-center gap-2">
                    {getTestIcon(result.tests.notBlocked)}
                    <span className="text-xs">{result.tests.notBlocked ? "Clear" : "Detected"}</span>
                  </div>
                </div>
              </div>

              {result.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recommendations:</p>
                  {result.recommendations.map((rec, index) => (
                    <p key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      {rec}
                    </p>
                  ))}
                </div>
              )}

              {result.details && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Technical Details</summary>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <p>Current URL: {result.details.currentUrl}</p>
                    <p>User Agent: {result.details.userAgent.substring(0, 80)}...</p>
                    <p>IP Response: {result.details.ipResponse.substring(0, 100)}...</p>
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
