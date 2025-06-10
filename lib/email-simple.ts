import nodemailer from "nodemailer"
import type { Property } from "./types"

// Configuración simple de email
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendPropertyEmail(email: string, properties: Property[], criteria: any) {
  try {
    const htmlContent = generateEmailHTML(properties, criteria)

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `🏠 ${properties.length} propiedades encontradas - Property Finder`,
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)
    console.log(`✅ Email sent to ${email}`)
  } catch (error) {
    console.error("❌ Email error:", error)
    throw error
  }
}

function generateEmailHTML(properties: Property[], criteria: any): string {
  const neighborhoods = criteria.neighborhoods?.join(", ") || "Todos"
  const priceFilter = criteria.maxPricePerM2 ? `Máx $${criteria.maxPricePerM2}/m²` : "Sin límite"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Property Finder - Resultados</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .property { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
        .title { font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #2563eb; }
        .details { font-size: 14px; color: #666; margin-bottom: 8px; }
        .price { color: #059669; font-weight: bold; font-size: 18px; }
        .button { background: #2563eb; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 8px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏠 Property Finder Argentina</h1>
        <p><strong>${properties.length} propiedades encontradas</strong></p>
        <p>Barrios: ${neighborhoods} | ${priceFilter} | Solo propietarios: ${criteria.ownerOnly ? "Sí" : "No"}</p>
      </div>
      
      ${properties
        .map(
          (property) => `
        <div class="property">
          <div class="title">${property.title}</div>
          <div class="details">
            📍 ${property.neighborhood} | 📐 ${property.surface}m² | 🏢 ${property.source}
            ${property.isOwner ? " | 👤 Propietario" : ""}
          </div>
          <div class="price">$${property.totalPrice.toLocaleString()} ($${property.pricePerM2}/m²)</div>
          <a href="${property.link}" class="button" target="_blank">Ver Propiedad</a>
        </div>
      `,
        )
        .join("")}
      
      <div class="footer">
        <p>Property Finder Argentina - Búsqueda automática de propiedades</p>
        <p>Este email fue generado automáticamente</p>
      </div>
    </body>
    </html>
  `
}
