"use client"

import { useState, useEffect } from "react"
import { PropertyForm } from "@/components/property-form"
import { PropertyResults } from "@/components/property-results"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Property } from "@/lib/types"
import { DebugPanel } from "@/components/debug-panel"

export default function Home() {
  const [results, setResults] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Función para verificar estado del trabajo
  const checkJobStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/job-status/${id}`)

      if (!response.ok) {
        throw new Error("Failed to check job status")
      }

      const data = await response.json()

      if (data.job.status === "completed") {
        // Si el trabajo está completo, actualizar resultados y detener polling
        setResults(data.properties || [])
        setLoading(false)

        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }

        if (data.properties.length === 0) {
          setError("No properties found matching your criteria. Try adjusting your filters.")
        }
      } else if (data.job.status === "failed") {
        // Si el trabajo falló, mostrar error y detener polling
        setError(data.job.error || "Failed to search properties")
        setLoading(false)

        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }
      }
    } catch (error) {
      console.error("Error checking job status:", error)
    }
  }

  const handleSearch = async (criteria: any) => {
    setLoading(true)
    setError(null)
    setSearchCriteria(criteria)

    // Limpiar intervalo anterior si existe
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }

    try {
      console.log("Frontend: Starting search with criteria:", criteria)

      const response = await fetch("/api/search-properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(criteria),
      })

      console.log("Frontend: API response status:", response.status)

      if (!response.ok) {
        let errorMessage = "Failed to search properties"
        try {
          const errorData = await response.json()
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch (jsonError) {
          // Si no podemos parsear el JSON, usamos el texto de la respuesta
          errorMessage = await response.text()
        }

        console.error("Frontend: API error:", errorMessage)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Frontend: Received data:", data)

      // Actualizar resultados iniciales
      setResults(data.properties || [])

      // Si hay un jobId y no hay suficientes resultados, iniciar polling
      if (data.jobId && data.properties.length < 5) {
        setJobId(data.jobId)

        // Iniciar polling cada 2 segundos
        const interval = setInterval(() => {
          checkJobStatus(data.jobId)
        }, 2000)

        setPollingInterval(interval)
      } else {
        setLoading(false)
      }

      if (data.properties?.length === 0) {
        setError("No properties found matching your criteria. Try adjusting your filters.")
      }
    } catch (error) {
      console.error("Frontend: Search error:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
      setResults([])
      setLoading(false)
    }
  }

  const handleScheduleEmail = async (email: string) => {
    if (!searchCriteria) return

    try {
      const response = await fetch("/api/schedule-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...searchCriteria,
          email,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to schedule email")
      }

      // Show success message
      alert("Email notifications scheduled successfully!")
    } catch (error) {
      console.error("Schedule error:", error)
      alert("Failed to schedule email notifications")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Property Finder Argentina</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <PropertyForm onSearch={handleSearch} loading={loading} onScheduleEmail={handleScheduleEmail} />
            <DebugPanel onTestScraping={handleSearch} />
          </div>

          <div className="lg:col-span-2">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            <PropertyResults properties={results} loading={loading} searchCriteria={searchCriteria} />
          </div>
        </div>
      </main>
    </div>
  )
}
