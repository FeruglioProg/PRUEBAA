"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, DollarSign, Mail, Clock, Beaker } from "lucide-react"

interface PropertyFormProps {
  onSearch: (criteria: any) => void
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

export function PropertyForm({ onSearch, loading, onScheduleEmail }: PropertyFormProps) {
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [ownerOnly, setOwnerOnly] = useState(false)
  const [timeRange, setTimeRange] = useState("")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [maxPricePerM2, setMaxPricePerM2] = useState("")
  const [email, setEmail] = useState("")
  const [scheduleTime, setScheduleTime] = useState("09:00")

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
      alert("Please select at least one neighborhood")
      return
    }

    if (!timeRange) {
      alert("Please select a time range")
      return
    }

    if (!email || !email.includes("@gmail.com")) {
      alert("Please enter a valid Gmail address")
      return
    }

    const criteria = {
      neighborhoods: selectedNeighborhoods,
      ownerOnly,
      timeRange,
      customStartDate: timeRange === "custom" ? customStartDate : null,
      customEndDate: timeRange === "custom" ? customEndDate : null,
      maxPricePerM2: maxPricePerM2 ? Number.parseFloat(maxPricePerM2) : null,
      email,
      scheduleTime,
    }

    onSearch(criteria)
  }

  const handleScheduleEmail = () => {
    if (!email || !email.includes("@gmail.com")) {
      alert("Please enter a valid Gmail address")
      return
    }
    onScheduleEmail(email)
  }

  const fillTestData = () => {
    setSelectedNeighborhoods(["Palermo", "Belgrano", "Recoleta"])
    setOwnerOnly(false)
    setTimeRange("7d")
    setMaxPricePerM2("")
    setEmail("test@gmail.com")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Search Properties
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Neighborhoods */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Neighborhoods</Label>
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

          {/* Max Price per M2 */}
          <div className="space-y-2">
            <Label htmlFor="maxPrice" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Max Price per m² (USD)
            </Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="e.g. 2500"
              value={maxPricePerM2}
              onChange={(e) => setMaxPricePerM2(e.target.value)}
            />
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Searching..." : "Search Properties"}
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
        </form>
      </CardContent>
    </Card>
  )
}
