"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SupabaseStatus } from "./supabase-status"

interface DebugPanelProps {
  onTestScraping: () => void
}

export function DebugPanel({ onTestScraping }: DebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSupabaseConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/search-properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          neighborhoods: ["Palermo", "Belgrano"],
          timeRange: "7d",
          ownerOnly: false,
        }),
      })

      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      setDebugInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🐛 Panel de Debug
            <Badge variant="secondary">Supabase Mode</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={testSupabaseConnection} variant="outline" className="w-full" disabled={loading}>
              {loading ? "Probando..." : "🧪 Probar Conexión Supabase"}
            </Button>

            {debugInfo && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <SupabaseStatus />
    </div>
  )
}
