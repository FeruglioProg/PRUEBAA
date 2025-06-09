"use client"

import type { Property } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Home, DollarSign, Ruler } from "lucide-react"

interface PropertyResultsProps {
  properties: Property[]
  loading: boolean
  searchCriteria: any
}

export function PropertyResults({ properties, loading, searchCriteria }: PropertyResultsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Searching Properties...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
            Property Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Use the search form to find properties</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Property Results ({properties.length} found)
        </CardTitle>
        {searchCriteria && (
          <div className="flex flex-wrap gap-2 mt-2">
            {searchCriteria.neighborhoods?.map((neighborhood: string) => (
              <Badge key={neighborhood} variant="secondary">
                {neighborhood}
              </Badge>
            ))}
            {searchCriteria.ownerOnly && <Badge variant="outline">Owner Only</Badge>}
            {searchCriteria.maxPricePerM2 && <Badge variant="outline">Max ${searchCriteria.maxPricePerM2}/m²</Badge>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No properties found matching your criteria</p>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <div key={property.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{property.title}</h3>

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
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {property.source}
                      </Badge>
                      {property.isOwner && (
                        <Badge variant="secondary" className="text-xs">
                          Owner
                        </Badge>
                      )}
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
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
