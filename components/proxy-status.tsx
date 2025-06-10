"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface ProxyTestResult {
  success: boolean
  tests?: {
    directProxy: { success: boolean; description: string }
    browserProxy: { success: boolean; description: string }
  }
  proxyInfo?: {
    host: string
    port: number
    username: string
    protocol: string
  }
  recommendations?: string[]
  message?: string
}

export function ProxyStatus() {
  const [status, setStatus] = useState<ProxyTestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastTest, setLastTest] = useState<Date | null>(null)
  const [configured, setConfigured] = useState(true)

  const testProxy = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-bright-data")
      const data = await response.json()

      if (response.ok) {
        setStatus(data)
        setLastTest(new Date())
        setConfigured(!data.message || data.message !== "Proxy not configured")
      } else {
        setStatus({
          success: false,
          tests: {
            directProxy: { success: false, description: "Test failed" },
            browserProxy: { success: false, description: "Test failed" },
          },
          proxyInfo: { host: "", port: 0, username: "", protocol: "" },
          recommendations: ["❌ Failed to test proxy"],
        })
      }
    } catch (error) {
      console.error("Error testing proxy:", error)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Probar automáticamente al cargar
    testProxy()
  }, [])

  const getStatusIcon = () => {
    if (!configured) return <AlertTriangle className="h-5 w-5 text-amber-500" />
    if (!status) return <WifiOff className="h-5 w-5 text-gray-500" />
    if (status.success) return <Wifi className="h-5 w-5 text-green-500" />
    return <WifiOff className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = () => {
    if (!configured) return <Badge variant="outline">No configurado</Badge>
    if (!status) return <Badge variant="secondary">Unknown</Badge>
    if (status.success) return <Badge variant="default">Connected</Badge>
    return <Badge variant="destructive">Failed</Badge>
  }

  if (!configured) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Bright Data Proxy
            <Badge variant="outline">No configurado</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            <p>El proxy no está configurado. Agregue las variables de entorno necesarias.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Bright Data Proxy Status
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status && status.tests && (
            <>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">Direct Connection</span>
                  <div className="flex items-center gap-2">
                    {status.tests.directProxy.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs">{status.tests.directProxy.success ? "Working" : "Failed"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium">Browser Connection</span>
                  <div className="flex items-center gap-2">
                    {status.tests.browserProxy.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs">{status.tests.browserProxy.success ? "Working" : "Failed"}</span>
                  </div>
                </div>
              </div>

              {status.proxyInfo && status.proxyInfo.host && (
                <div className="text-xs text-muted-foreground">
                  <p>
                    Host: {status.proxyInfo.host}:{status.proxyInfo.port}
                  </p>
                  <p>Protocol: {status.proxyInfo.protocol}</p>
                  <p>Auth: {status.proxyInfo.username}</p>
                </div>
              )}

              {status.recommendations && status.recommendations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Recommendations:</p>
                  {status.recommendations.map((rec, index) => (
                    <p key={index} className="text-xs text-muted-foreground">
                      {rec}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between">
            <Button onClick={testProxy} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Testing..." : "Test Proxy"}
            </Button>

            {lastTest && (
              <span className="text-xs text-muted-foreground">Last test: {lastTest.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
