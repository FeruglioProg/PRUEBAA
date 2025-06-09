import cron from "node-cron"
import { scrapeProperties } from "./scraper"
import { sendPropertyEmail } from "./email"

interface ScheduledSearch {
  id: string
  criteria: any
  email: string
  scheduleTime: string
  isActive: boolean
}

// In production, this would be stored in a database
const scheduledSearches: ScheduledSearch[] = []

export function schedulePropertySearch(criteria: any, email: string, scheduleTime: string) {
  const searchId = `${email}-${Date.now()}`

  const scheduledSearch: ScheduledSearch = {
    id: searchId,
    criteria,
    email,
    scheduleTime,
    isActive: true,
  }

  scheduledSearches.push(scheduledSearch)

  // Parse schedule time (e.g., "09:00" -> hour: 9, minute: 0)
  const [hour, minute] = scheduleTime.split(":").map(Number)

  // Schedule the cron job
  const cronExpression = `${minute} ${hour} * * *` // Daily at specified time

  cron.schedule(cronExpression, async () => {
    if (!scheduledSearch.isActive) return

    try {
      console.log(`Running scheduled search for ${email}`)
      const properties = await scrapeProperties(criteria)

      if (properties.length > 0) {
        await sendPropertyEmail(email, properties, criteria)
        console.log(`Sent ${properties.length} properties to ${email}`)
      } else {
        console.log(`No new properties found for ${email}`)
      }
    } catch (error) {
      console.error(`Error in scheduled search for ${email}:`, error)
    }
  })

  return searchId
}

export function unsubscribeSearch(searchId: string) {
  const search = scheduledSearches.find((s) => s.id === searchId)
  if (search) {
    search.isActive = false
  }
}

export function getActiveSearches(): ScheduledSearch[] {
  return scheduledSearches.filter((s) => s.isActive)
}
