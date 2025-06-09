import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendPropertyEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { email, scheduleTime, ...criteria } = data

    // Validate email
    if (!email || !email.includes("@gmail.com")) {
      return NextResponse.json({ error: "Valid Gmail address is required" }, { status: 400 })
    }

    // Validate schedule time
    if (!scheduleTime || !/^\d{2}:\d{2}$/.test(scheduleTime)) {
      return NextResponse.json({ error: "Valid schedule time is required (HH:MM format)" }, { status: 400 })
    }

    // Guardar búsqueda programada en Supabase
    const { data: scheduledSearch, error } = await supabaseAdmin
      .from("scheduled_searches")
      .insert({
        email,
        schedule_time: scheduleTime,
        neighborhoods: criteria.neighborhoods || [],
        owner_only: criteria.ownerOnly || false,
        time_range: criteria.timeRange,
        custom_start_date: criteria.customStartDate,
        custom_end_date: criteria.customEndDate,
        max_price_per_m2: criteria.maxPricePerM2,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving scheduled search:", error)
      return NextResponse.json({ error: "Failed to schedule email" }, { status: 500 })
    }

    // Enviar email de confirmación inmediato con propiedades actuales
    try {
      const { data: properties } = await supabaseAdmin
        .from("properties")
        .select("*")
        .in("neighborhood", criteria.neighborhoods || [])
        .limit(5)

      if (properties && properties.length > 0) {
        await sendPropertyEmail(email, properties, criteria)
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError)
      // No fallar la operación si el email falla
    }

    return NextResponse.json({
      success: true,
      searchId: scheduledSearch.id,
      message: `Daily email scheduled for ${scheduleTime}`,
    })
  } catch (error) {
    console.error("Schedule error:", error)
    return NextResponse.json({ error: "Failed to schedule email" }, { status: 500 })
  }
}
