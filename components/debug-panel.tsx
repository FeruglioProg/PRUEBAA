"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SupabaseStatus } from "./supabase-status"
import { SetupWizard } from "./setup-wizard"

interface DebugPanelProps {
  onTestScraping: (criteria: any) => void
}

export function DebugPanel({ onTestScraping }: DebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testQuickSearch = async () => {
    setLoading(true)
    try {
      // Ejecutar búsqueda de prueba
      const testCriteria = {
        neighborhoods: ["Palermo", "Belgrano"],
        timeRange: "7d",
        ownerOnly: false,
        email: "test@gmail.com",
        scheduleTime: "09:00",
      }

      onTestScraping(testCriteria)
      setDebugInfo({ message: "Búsqueda de prueba ejecutada", criteria: testCriteria })
    } catch (error) {
      setDebugInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <SetupWizard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🐛 Panel de Debug
            <Badge variant="secondary">Supabase Mode</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={testQuickSearch} variant="outline" className="w-full" disabled={loading}>
              {loading ? "Probando..." : "🚀 Búsqueda Rápida de Prueba"}
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
