import { NextResponse } from "next/server"
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase"

export async function GET() {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      // Return mock data if Supabase is not configured
      return NextResponse.json({
        stats: {
          totalJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          pendingJobs: 0,
          processingJobs: 0,
          totalProperties: 0,
          successRate: 0,
        },
        status: "not_configured",
        timestamp: new Date().toISOString(),
        message: "Supabase not configured",
      })
    }

    // Obtener estadísticas de trabajos de scraping
    const { data: jobs, error } = await supabaseAdmin
      .from("scraping_jobs")
      .select("status, created_at")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24 horas

    if (error) {
      throw error
    }

    const stats = {
      totalJobs: jobs.length,
      completedJobs: jobs.filter((j) => j.status === "completed").length,
      failedJobs: jobs.filter((j) => j.status === "failed").length,
      pendingJobs: jobs.filter((j) => j.status === "pending").length,
      processingJobs: jobs.filter((j) => j.status === "processing").length,
    }

    const successRate = stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0

    // Obtener total de propiedades
    const { count: totalProperties } = await supabaseAdmin
      .from("properties")
      .select("*", { count: "exact", head: true })

    return NextResponse.json({
      stats: {
        ...stats,
        totalProperties,
        successRate: Math.round(successRate),
      },
      status: successRate > 70 ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error getting scraping status:", error)
    return NextResponse.json(
      {
        error: "Failed to get scraping status",
        stats: {
          totalJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          pendingJobs: 0,
          processingJobs: 0,
          totalProperties: 0,
          successRate: 0,
        },
        status: "error",
      },
      { status: 500 },
    )
  }
}
