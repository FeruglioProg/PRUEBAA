"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SimpleHome() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/search-properties-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ neighborhoods: ["Palermo"] }),
      })

      const data = await response.json()
      setResults(data.properties || [])
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Property Finder Argentina</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Buscar Propiedades</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSearch} disabled={loading} className="w-full">
              {loading ? "Buscando..." : "Buscar Propiedades en Palermo"}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados ({results.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((property: any) => (
                  <div key={property.id} className="border p-4 rounded-lg">
                    <h3 className="font-semibold">{property.title}</h3>
                    <p className="text-sm text-gray-600">
                      ${property.total_price?.toLocaleString()} - {property.surface}m² - ${property.price_per_m2}/m² -{" "}
                      {property.source}
                    </p>
                    <a
                      href={property.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Ver propiedad →
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
