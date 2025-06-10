"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase, testSupabaseConnection } from "@/lib/supabase"

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [properties, setProperties] = useState<any[]>([])

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    setStatus("loading")

    try {
      // Probar conexión
      const result = await testSupabaseConnection()

      if (result.success) {
        setStatus("success")
        setMessage(result.message)

        // Intentar cargar propiedades
        const { data, error } = await supabase.from("properties").select("*").limit(5)

        if (error) throw error
        setProperties(data || [])
      } else {
        setStatus("error")
        setMessage(result.message)
      }
    } catch (error) {
      setStatus("error")
      setMessage(error.message || "Error desconocido")
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Test de Conexión con Supabase</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Estado de la Conexión
            {status === "loading" && <Badge className="bg-yellow-500">Verificando...</Badge>}
            {status === "success" && <Badge className="bg-green-500">Conectado</Badge>}
            {status === "error" && <Badge variant="destructive">Error</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{message}</p>
          <Button onClick={checkConnection} disabled={status === "loading"}>
            {status === "loading" ? "Verificando..." : "Probar Conexión"}
          </Button>
        </CardContent>
      </Card>

      {properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Propiedades ({properties.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {properties.map((property) => (
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
  )
}
