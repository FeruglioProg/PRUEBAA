import { type NextRequest, NextResponse } from "next/server"

// Conditional import to handle build-time issues
let prisma: any = null
try {
  const { prisma: prismaClient } = require("@/lib/db")
  prisma = prismaClient
} catch (error) {
  console.warn("Prisma client not available:", error.message)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Check if Prisma is available
    if (!prisma) {
      return NextResponse.json(
        {
          error: "Database not available",
          job: { id: jobId, status: "pending" },
          properties: [],
          count: 0,
        },
        { status: 503 },
      )
    }

    // Get job status
    const job = await prisma.scrapingJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // If job is complete, get properties
    let properties = []
    if (job.status === "completed" && job.result) {
      const propertyIds = job.result.properties || []
      properties = await prisma.property.findMany({
        where: {
          id: {
            in: propertyIds,
          },
        },
      })
    }

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
      },
      properties: job.status === "completed" ? properties : [],
      count: job.status === "completed" ? properties.length : 0,
    })
  } catch (error) {
    console.error("API: Job status error:", error)

    return NextResponse.json(
      {
        error: "Failed to get job status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
