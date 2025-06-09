"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database, Activity, TrendingUp, Clock } from "lucide-react"

interface ScrapingStats {
  totalJobs: number
  completedJobs: number
  failedJobs: number
  pendingJobs: number
  processingJobs: number
  totalProperties: number
  successRate: number
}

export function SupabaseStatus() {
  const [stats, setStats] = useState<ScrapingStats | null>(null)
  const [status, setStatus] = useState<string>("unknown")
  const [loading, setLoading] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/scraping-status")
      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
        setStatus(data.status)
      }
    } catch (error) {
      console.error("Error fetching status:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500"
      case "degraded":
        return "bg-yellow-500"
      default:
        return "bg-red-500"
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sistema Supabase
          <Badge variant={status === "healthy" ? "default" : "destructive"}>
            {status === "healthy" ? "Operativo" : "Degradado"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-medium">Trabajos (24h)</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalJobs}</div>
                <div className="text-xs text-muted-foreground">
                  ✅ {stats.completedJobs} • ❌ {stats.failedJobs} • ⏳ {stats.pendingJobs}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Tasa de Éxito</span>
                </div>
                <div className="text-2xl font-bold">{stats.successRate}%</div>
                <div className="text-xs text-muted-foreground">{stats.totalProperties} propiedades totales</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
            <span className="text-sm">
              {status === "healthy" ? "Sistema funcionando correctamente" : "Sistema con problemas"}
            </span>
          </div>

          <Button onClick={fetchStatus} variant="outline" size="sm" disabled={loading} className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            {loading ? "Actualizando..." : "Actualizar Estado"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
