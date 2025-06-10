export interface Property {
  id: string
  title: string
  link: string
  totalPrice: number
  surface: number
  pricePerM2: number
  source: "Zonaprop" | "Argenprop" | "MercadoLibre"
  neighborhood: string
  isOwner: boolean
  publishedDate: Date | string
}

export interface NeighborhoodPrice {
  neighborhood: string
  maxPricePerM2?: number
}

export interface SearchCriteria {
  neighborhoods: string[]
  neighborhoodPrices?: NeighborhoodPrice[]
  ownerOnly: boolean
  timeRange: string
  customStartDate?: string
  customEndDate?: string
  globalMaxPricePerM2?: number
  email: string
  scheduleTime: string
}

export interface ScrapingJob {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  criteria: any
  result?: any
  error?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface ScheduledSearch {
  id: string
  email: string
  schedule_time: string
  neighborhoods: string[]
  owner_only: boolean
  time_range: string
  custom_start_date?: string
  custom_end_date?: string
  max_price_per_m2?: number
  is_active: boolean
  created_at: string
  updated_at: string
}
