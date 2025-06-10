"use client"

import { useState } from "react"
import { PropertyForm } from "@/components/property-form"
import { PropertyResults } from "@/components/property-results"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Property } from "@/lib/types"

export default function Home() {
  const [results, setResults] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [searchCriteria, setSearchCriteria] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRealTimeSearch = async (criteria: any) => {
    setLoading(true)
    setError(null)
    setSearchCriteria(criteria)

    try {
      const response = await fetch("/api/search-properties-real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data.properties || [])

        if (data.properties?.length === 0) {
          setError("No se encontraron propiedades en tiempo real")
        }
      } else {
        setError("Error en scraping real: " + data.error)
        setResults([])
      }
    } catch (error) {
      setError("Error al realizar scraping en tiempo real")
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleEmail = async (email: string) => {
    if (!searchCriteria) return

    try {
      const response = await fetch("/api/schedule-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...searchCriteria, email }),
      })

      if (response.ok) {
        alert("¡Email programado exitosamente!")
      }
    } catch (error) {
      alert("Error al programar email")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Property Finder Argentina</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <PropertyForm
              onRealTimeSearch={handleRealTimeSearch}
              loading={loading}
              onScheduleEmail={handleScheduleEmail}
            />
          </div>

          <div className="lg:col-span-2">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
            <PropertyResults properties={results} loading={loading} searchCriteria={searchCriteria} />
          </div>
        </div>
      </main>
    </div>
  )
}
