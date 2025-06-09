import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const criteria = await request.json()

    // Datos de prueba garantizados
    const testProperties = [
      {
        id: "test-1",
        title: "TEST: Departamento en Palermo",
        link: "https://example.com/test-1",
        totalPrice: 150000,
        surface: 60,
        pricePerM2: 2500,
        source: "Test",
        neighborhood: "Palermo",
        isOwner: false,
        publishedDate: new Date(),
      },
      {
        id: "test-2",
        title: "TEST: Monoambiente en Belgrano",
        link: "https://example.com/test-2",
        totalPrice: 100000,
        surface: 40,
        pricePerM2: 2500,
        source: "Test",
        neighborhood: "Belgrano",
        isOwner: true,
        publishedDate: new Date(),
      },
    ]

    return NextResponse.json({
      success: true,
      criteria,
      properties: testProperties,
      count: testProperties.length,
      message: "Debug test successful - if you see this, the API is working",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Debug test failed",
      },
      { status: 500 },
    )
  }
}
