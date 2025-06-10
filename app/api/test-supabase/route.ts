import { NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🧪 Testing Supabase connection...")

    // Test 1: Conexión básica
    const { data: connectionTest, error: connectionError } = await supabase
      .from("properties")
      .select("count", { count: "exact", head: true })

    if (connectionError) {
      throw new Error(`Connection failed: ${connectionError.message}`)
    }

    // Test 2: Leer propiedades
    const { data: properties, error: readError } = await supabase.from("properties").select("*").limit(5)

    if (readError) {
      throw new Error(`Read failed: ${readError.message}`)
    }

    // Test 3: Insertar propiedad de prueba (solo con admin)
    const testProperty = {
      id: `test-${Date.now()}`,
      title: "TEST: Departamento de prueba en Palermo",
      link: "https://www.zonaprop.com.ar/test",
      total_price: 150000,
      surface: 60,
      price_per_m2: 2500,
      source: "Test",
      neighborhood: "Palermo",
      is_owner: true,
      published_date: new Date().toISOString(),
    }

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("properties")
      .insert(testProperty)
      .select()

    if (insertError) {
      console.warn(`Insert test failed: ${insertError.message}`)
    }

    // Test 4: Crear trabajo de scraping
    const { data: job, error: jobError } = await supabaseAdmin
      .from("scraping_jobs")
      .insert({
        status: "completed",
        criteria: { test: true },
        result: { properties: [testProperty.id] },
      })
      .select()

    if (jobError) {
      console.warn(`Job creation failed: ${jobError.message}`)
    }

    return NextResponse.json({
      success: true,
      tests: {
        connection: "✅ OK",
        read: "✅ OK",
        insert: insertError ? "⚠️ Limited" : "✅ OK",
        jobs: jobError ? "⚠️ Limited" : "✅ OK",
      },
      data: {
        totalProperties: connectionTest,
        sampleProperties: properties?.slice(0, 3),
        testProperty: insertData?.[0],
        testJob: job?.[0],
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Supabase test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
