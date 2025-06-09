import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Obtener estado del trabajo
    const job = await prisma.scrapingJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Si el trabajo está completo, obtener propiedades
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
