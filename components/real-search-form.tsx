"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, AlertCircle } from "lucide-react"

const neighborhoods = [
  "Palermo",
  "Belgrano",
  "Recoleta",
  "Puerto Madero",
  "San Telmo",
  "Villa Crespo",
  "Caballito",
  "Flores",
  "Almagro",
  "Barracas",
]

interface RealSearchFormProps {
  onSearch: (criteria: any) => void
  loading: boolean
}

export function RealSearchForm({ onSearch, loading }: RealSearchFormProps) {
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [ownerOnly, setOwnerOnly] = useState(false)
  const [maxPricePerM2, setMaxPricePerM2] = useState("")
  const [email, setEmail] = useState("")

  const handleNeighborhoodChange = (neighborhood: string, checked: boolean) => {
    if (checked) {
      setSelectedNeighborhoods([...selectedNeighborhoods, neighborhood])
    } else {
      setSelectedNeighborhoods(selectedNeighborhoods.filter((n) => n !== neighborhood))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedNeighborhoods.length === 0) {
      alert("Selecciona al menos un barrio")
      return
    }

    const criteria = {
      neighborhoods: selectedNeighborhoods,
      ownerOnly,
      maxPricePerM2: maxPricePerM2 ? Number.parseFloat(maxPricePerM2) : null,
      email: email || null,
    }

    onSearch(criteria)
  }

  const fillTestData = () => {
    setSelectedNeighborhoods(["Palermo", "Belgrano"])
    setOwnerOnly(false)
    setMaxPricePerM2("3000")
    setEmail("test@gmail.com")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Búsqueda Real de Propiedades
          <Badge className="bg-green-500">SCRAPING REAL</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-blue-800 dark:text-blue-200">Scraping Real Activado</span>
          </div>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Esta búsqueda obtendrá datos reales de Zonaprop, Argenprop y MercadoLibre. Puede tomar 1-2 minutos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Barrios */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Barrios a buscar</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {neighborhoods.map((neighborhood) => (
                <div key={neighborhood} className="flex items-center space-x-2">
                  <Checkbox
                    id={neighborhood}
                    checked={selectedNeighborhoods.includes(neighborhood)}
                    onCheckedChange={(checked) => handleNeighborhoodChange(neighborhood, checked as boolean)}
                  />
                  <Label htmlFor={neighborhood} className="text-sm cursor-pointer">
                    {neighborhood}
                  </Label>
                </div>
              ))}
            </div>
            {selectedNeighborhoods.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedNeighborhoods.map((n) => (
                  <Badge key={n} variant="secondary" className="text-xs">
                    {n}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Solo propietarios */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ownerOnly"
              checked={ownerOnly}
              onCheckedChange={(checked) => setOwnerOnly(checked as boolean)}
            />
            <Label htmlFor="ownerOnly" className="text-sm cursor-pointer">
              Solo propiedades de propietarios (sin inmobiliarias)
            </Label>
          </div>

          {/* Precio máximo por m² */}
          <div className="space-y-2">
            <Label htmlFor="maxPrice">Precio máximo por m² (USD)</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="ej: 3000"
              value={maxPricePerM2}
              onChange={(e) => setMaxPricePerM2(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email (opcional - para recibir resultados)
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu-email@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Botones */}
          <div className="space-y-3">
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? "Buscando en sitios reales..." : "🔍 Buscar Propiedades Reales"}
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={fillTestData}>
              📝 Llenar con datos de prueba
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
