import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { email, scheduleTime } = data

    // Validar email
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email válido requerido" }, { status: 400 })
    }

    // En una versión completa, aquí guardaríamos en base de datos
    // Pero para la versión simplificada, solo simulamos éxito
    console.log(`📅 Email programado: ${email} a las ${scheduleTime}`)
    console.log(`📋 Criterios de búsqueda:`, data)

    return NextResponse.json({
      success: true,
      message: `Email programado para ${scheduleTime}`,
      searchId: `search-${Date.now()}`,
    })
  } catch (error) {
    return NextResponse.json({ error: "Error al programar email" }, { status: 500 })
  }
}
