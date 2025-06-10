"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, DollarSign, Mail, Clock, Beaker, Search, X, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PropertyFormProps {
  onRealTimeSearch: (criteria: any) => void
  loading: boolean
  onScheduleEmail: (email: string) => void
}

const neighborhoods = [
  "Belgrano",
  "Palermo",
  "Recoleta",
  "Puerto Madero",
  "San Telmo",
  "La Boca",
  "Barracas",
  "Villa Crespo",
  "Caballito",
  "Flores",
  "Almagro",
  "Balvanera",
  "Retiro",
  "Microcentro",
  "Monserrat",
]

const timeRanges = [
  { value: "24h", label: "Last 24 hours" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last 7 days" },
  { value: "custom", label: "Custom date range" },
]

interface NeighborhoodPrice {
  neighborhood: string
  maxPricePerM2?: number
}

export function PropertyForm({ onRealTimeSearch, loading, onScheduleEmail }: PropertyFormProps) {
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<NeighborhoodPrice[]>([])
  const [ownerOnly, setOwnerOnly] = useState(false)
  const [timeRange, setTimeRange] = useState("")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [globalMaxPricePerM2, setGlobalMaxPricePerM2] = useState("")
  const [email, setEmail] = useState("")
  const [scheduleTime, setScheduleTime] = useState("09:00")
  const [showNeighborhoodPrices, setShowNeighborhoodPrices] = useState(false)

  const handleNeighborhoodChange = (neighborhood: string, checked: boolean) => {
    if (checked) {
      setSelectedNeighborhoods([...selectedNeighborhoods, { neighborhood }])
    } else {
      setSelectedNeighborhoods(selectedNeighborhoods.filter((n) => n.neighborhood !== neighborhood))
    }
  }

  const updateNeighborhoodPrice = (neighborhood: string, price: string) => {
    setSelectedNeighborhoods(
      selectedNeighborhoods.map((n) =>
        n.neighborhood === neighborhood ? { ...n, maxPricePerM2: price ? Number.parseFloat(price) : undefined } : n,
      ),
    )
  }

  const removeNeighborhood = (neighborhood: string) => {
    setSelectedNeighborhoods(selectedNeighborhoods.filter((n) => n.neighborhood !== neighborhood))
  }

  const isNeighborhoodSelected = (neighborhood: string) => {
    return selectedNeighborhoods.some((n) => n.neighborhood === neighborhood)
  }

  const getNeighborhoodPrice = (neighborhood: string) => {
    const found = selectedNeighborhoods.find((n) => n.neighborhood === neighborhood)
    return found?.maxPricePerM2?.toString() || ""
  }

  const handleRealTimeSearch = async () => {
    if (selectedNeighborhoods.length === 0) {
      alert("Please select at least one neighborhood")
      return
    }

    if (!timeRange) {
      alert("Please select a time range")
      return
    }

    const criteria = {
      neighborhoods: selectedNeighborhoods.map((n) => n.neighborhood),
      neighborhoodPrices: selectedNeighborhoods,
      ownerOnly,
      timeRange,
      customStartDate: timeRange === "custom" ? customStartDate : null,
      customEndDate: timeRange === "custom" ? customEndDate : null,
      globalMaxPricePerM2: globalMaxPricePerM2 ? Number.parseFloat(globalMaxPricePerM2) : null,
    }

    onRealTimeSearch(criteria)
  }

  const handleScheduleEmail = () => {
    if (!email || !email.includes("@gmail.com")) {
      alert("Please enter a valid Gmail address")
      return
    }
    onScheduleEmail(email)
  }

  const fillTestData = () => {
    setSelectedNeighborhoods([
      { neighborhood: "Palermo", maxPricePerM2: 3500 },
      { neighborhood: "Belgrano", maxPricePerM2: 3000 },
      { neighborhood: "Recoleta", maxPricePerM2: 4000 },
    ])
    setOwnerOnly(false)
    setTimeRange("7d")
    setGlobalMaxPricePerM2("")
    setEmail("test@gmail.com")
    setShowNeighborhoodPrices(true)
  }

  const clearAllNeighborhoods = () => {
    setSelectedNeighborhoods([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Real-Time Property Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Neighborhoods */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Neighborhoods</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNeighborhoodPrices(!showNeighborhoodPrices)}
                  className="text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {showNeighborhoodPrices ? "Hide Prices" : "Set Prices"}
                </Button>
                {selectedNeighborhoods.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAllNeighborhoods}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {/* Selected Neighborhoods with Prices */}
            {selectedNeighborhoods.length > 0 && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                <Label className="text-xs font-medium text-gray-600">Selected Neighborhoods:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedNeighborhoods.map((item) => (
                    <div key={item.neighborhood} className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.neighborhood}
                        {item.maxPricePerM2 && (
                          <span className="ml-1 text-green-600 font-medium">≤${item.maxPricePerM2}/m²</span>
                        )}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNeighborhood(item.neighborhood)}
                        className="h-5 w-5 p-0 hover:bg-red-100"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Neighborhood Selection Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {neighborhoods.map((neighborhood) => (
                <div key={neighborhood} className="flex items-center space-x-2">
                  <Checkbox
                    id={neighborhood}
                    checked={isNeighborhoodSelected(neighborhood)}
                    onCheckedChange={(checked) => handleNeighborhoodChange(neighborhood, checked as boolean)}
                  />
                  <Label htmlFor={neighborhood} className="text-sm cursor-pointer flex-1">
                    {neighborhood}
                  </Label>
                </div>
              ))}
            </div>

            {/* Individual Neighborhood Prices */}
            {showNeighborhoodPrices && selectedNeighborhoods.length > 0 && (
              <div className="space-y-3 p-3 border rounded-md bg-blue-50">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Max Price per m² by Neighborhood
                </Label>
                <div className="grid gap-3">
                  {selectedNeighborhoods.map((item) => (
                    <div key={item.neighborhood} className="flex items-center gap-3">
                      <Label className="text-sm min-w-[100px] font-medium">{item.neighborhood}:</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 3500"
                        value={getNeighborhoodPrice(item.neighborhood)}
                        onChange={(e) => updateNeighborhoodPrice(item.neighborhood, e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-500">USD/m²</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  💡 Tip: Leave empty to use global max price, or set 0 for no limit on that neighborhood
                </div>
              </div>
            )}
          </div>

          {/* Owner Only */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ownerOnly"
              checked={ownerOnly}
              onCheckedChange={(checked) => setOwnerOnly(checked as boolean)}
            />
            <Label htmlFor="ownerOnly" className="text-sm cursor-pointer">
              Owner listings only
            </Label>
          </div>

          {/* Time Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Time Range
            </Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {timeRange === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Global Max Price per M2 */}
          <div className="space-y-2">
            <Label htmlFor="globalMaxPrice" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Global Max Price per m² (USD)
            </Label>
            <Input
              id="globalMaxPrice"
              type="number"
              placeholder="e.g. 3000 (applies to all neighborhoods without specific price)"
              value={globalMaxPricePerM2}
              onChange={(e) => setGlobalMaxPricePerM2(e.target.value)}
            />
            <div className="text-xs text-gray-500">This applies to neighborhoods without a specific price limit</div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Gmail Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Schedule Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduleTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily Email Time
            </Label>
            <Input
              id="scheduleTime"
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button type="button" className="w-full" onClick={handleRealTimeSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Scraping Properties..." : "🔴 Search Properties Live"}
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={handleScheduleEmail}>
              Schedule Daily Email
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
              onClick={fillTestData}
            >
              <Beaker className="h-4 w-4" />
              Fill with Test Data
            </Button>
          </div>

          {/* Search Summary */}
          {selectedNeighborhoods.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <Label className="text-sm font-medium text-green-800">Search Summary:</Label>
              <div className="text-xs text-green-700 mt-1 space-y-1">
                <div>• {selectedNeighborhoods.length} neighborhood(s) selected</div>
                <div>• {selectedNeighborhoods.filter((n) => n.maxPricePerM2).length} with specific price limits</div>
                {globalMaxPricePerM2 && (
                  <div>• Global max: ${globalMaxPricePerM2}/m² for neighborhoods without specific limits</div>
                )}
                {ownerOnly && <div>• Only owner listings</div>}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
