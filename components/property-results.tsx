"use client"

import { useState, useMemo } from "react"
import type { Property } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ExternalLink,
  Home,
  DollarSign,
  Ruler,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface PropertyResultsProps {
  properties: Property[]
  loading: boolean
  searchCriteria: any
  error?: string
}

export function PropertyResults({ properties, loading, searchCriteria, error }: PropertyResultsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<
    "price-asc" | "price-desc" | "price-per-m2-asc" | "price-per-m2-desc" | "surface-asc" | "surface-desc"
  >("price-per-m2-asc")
  const [filterText, setFilterText] = useState("")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [ownerFilter, setOwnerFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  // Filtrar y ordenar propiedades
  const filteredAndSortedProperties = useMemo(() => {
    let filtered = [...properties]

    // Filtro por texto
    if (filterText) {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(filterText.toLowerCase()) ||
          property.neighborhood.toLowerCase().includes(filterText.toLowerCase()),
      )
    }

    // Filtro por fuente
    if (sourceFilter !== "all") {
      filtered = filtered.filter((property) => property.source === sourceFilter)
    }

    // Filtro por propietario
    if (ownerFilter === "owner") {
      filtered = filtered.filter((property) => property.isOwner)
    } else if (ownerFilter === "agent") {
      filtered = filtered.filter((property) => !property.isOwner)
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.totalPrice - b.totalPrice
        case "price-desc":
          return b.totalPrice - a.totalPrice
        case "price-per-m2-asc":
          return a.pricePerM2 - b.pricePerM2
        case "price-per-m2-desc":
          return b.pricePerM2 - a.pricePerM2
        case "surface-asc":
          return a.surface - b.surface
        case "surface-desc":
          return b.surface - a.surface
        default:
          return a.pricePerM2 - b.pricePerM2
      }
    })

    return filtered
  }, [properties, filterText, sourceFilter, ownerFilter, sortBy])

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedProperties.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProperties = filteredAndSortedProperties.slice(startIndex, endIndex)

  // Estadísticas por fuente
  const sourceStats = useMemo(() => {
    const stats = properties.reduce(
      (acc, property) => {
        acc[property.source] = (acc[property.source] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return stats
  }, [properties])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔍 Buscando propiedades reales...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Realizando scraping en tiempo real de Zonaprop, Argenprop y MercadoLibre...
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!searchCriteria) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Resultados de Propiedades Reales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Usa el formulario de búsqueda para encontrar propiedades reales
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Propiedades Reales ({properties.length} extraídas, {filteredAndSortedProperties.length} mostradas)
          <Badge variant="outline" className="ml-2">
            Solo datos reales
          </Badge>
        </CardTitle>

        {/* Criterios de búsqueda */}
        {searchCriteria && (
          <div className="flex flex-wrap gap-2 mt-2">
            {searchCriteria.neighborhoods?.map((neighborhood: string) => (
              <Badge key={neighborhood} variant="secondary">
                {neighborhood}
              </Badge>
            ))}
            {searchCriteria.ownerOnly && <Badge variant="outline">Solo Dueños</Badge>}
            {searchCriteria.maxPricePerM2 && <Badge variant="outline">Max ${searchCriteria.maxPricePerM2}/m²</Badge>}
          </div>
        )}

        {/* Estadísticas por fuente */}
        {properties.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(sourceStats).map(([source, count]) => (
              <Badge key={source} variant="default" className="text-xs">
                {source}: {count}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error en el scraping</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {properties.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No se encontraron propiedades reales</p>
            <p className="text-sm text-muted-foreground">
              Los sitios web pueden estar bloqueando el acceso o no hay propiedades disponibles con estos criterios.
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              <p>💡 Sugerencias:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Intenta con menos barrios seleccionados</li>
                <li>Aumenta el precio máximo por m²</li>
                <li>Desactiva el filtro "Solo dueños"</li>
                <li>Los sitios pueden estar temporalmente bloqueando el scraping</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mensaje de éxito */}
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              ✅ Se encontraron {properties.length} propiedades reales extraídas directamente de los sitios web
            </div>

            {/* Controles de filtro y ordenamiento */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros y Ordenamiento
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedProperties.length)} de{" "}
                  {filteredAndSortedProperties.length}
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  {/* Búsqueda por texto */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Título o barrio..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Filtro por fuente */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fuente</label>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las fuentes</SelectItem>
                        <SelectItem value="Zonaprop">Zonaprop</SelectItem>
                        <SelectItem value="Argenprop">Argenprop</SelectItem>
                        <SelectItem value="MercadoLibre">MercadoLibre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por propietario */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="owner">Solo dueños</SelectItem>
                        <SelectItem value="agent">Solo inmobiliarias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ordenamiento */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ordenar por</label>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price-per-m2-asc">Precio/m² (menor a mayor)</SelectItem>
                        <SelectItem value="price-per-m2-desc">Precio/m² (mayor a menor)</SelectItem>
                        <SelectItem value="price-asc">Precio total (menor a mayor)</SelectItem>
                        <SelectItem value="price-desc">Precio total (mayor a menor)</SelectItem>
                        <SelectItem value="surface-asc">Superficie (menor a mayor)</SelectItem>
                        <SelectItem value="surface-desc">Superficie (mayor a menor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Control de elementos por página */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Mostrar:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value={properties.length.toString()}>Todas ({properties.length})</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm">por página</span>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de propiedades */}
            <div className="space-y-4 max-h-[800px] overflow-y-auto">
              {currentProperties.map((property, index) => (
                <div key={property.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-2 flex-1">{property.title}</h3>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          #{startIndex + index + 1}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">${property.totalPrice.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Ruler className="h-4 w-4" />
                          <span>{property.surface}m²</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">${property.pricePerM2}/m²</span>
                        </div>

                        <div className="text-xs text-muted-foreground">📍 {property.neighborhood}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {property.source}
                        </Badge>
                        {property.isOwner && (
                          <Badge variant="secondary" className="text-xs">
                            Dueño Directo
                          </Badge>
                        )}
                        <Badge variant="default" className="text-xs bg-green-600">
                          Datos Reales
                        </Badge>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      type="button"
                      onClick={() => window.open(property.link, "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Propiedad
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen final */}
            {filteredAndSortedProperties.length > 0 && (
              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                Mostrando {filteredAndSortedProperties.length} de {properties.length} propiedades extraídas
                {filteredAndSortedProperties.length !== properties.length && " (filtradas)"}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
