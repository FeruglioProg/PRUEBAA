import { NextResponse } from "next/server"
import { sendPropertyEmail } from "@/lib/email"

export async function POST() {
  try {
    // Verificar configuración de Gmail
    const gmailUser = process.env.GMAIL_USER
    const gmailPassword = process.env.GMAIL_APP_PASSWORD

    if (!gmailUser || !gmailPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Gmail configuration missing",
          details: "Please set GMAIL_USER and GMAIL_APP_PASSWORD in your environment variables",
        },
        { status: 400 },
      )
    }

    // Enviar email de prueba
    const testProperties = [
      {
        id: "test-1",
        title: "TEST: Departamento de prueba en Palermo",
        link: "https://www.zonaprop.com.ar/test",
        totalPrice: 150000,
        surface: 60,
        pricePerM2: 2500,
        source: "Test",
        neighborhood: "Palermo",
        isOwner: true,
        publishedDate: new Date(),
      },
    ]

    const testCriteria = {
      neighborhoods: ["Palermo"],
      ownerOnly: false,
      maxPricePerM2: 3000,
    }

    await sendPropertyEmail(gmailUser, testProperties, testCriteria)

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      sentTo: gmailUser,
    })
  } catch (error) {
    console.error("Gmail setup test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
