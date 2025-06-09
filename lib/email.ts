import nodemailer from "nodemailer"
import type { Property } from "./types"

// Email configuration
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
  },
})

export async function sendPropertyEmail(recipientEmail: string, properties: Property[], searchCriteria: any) {
  const htmlContent = generateEmailHTML(properties, searchCriteria)

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: recipientEmail,
    subject: `Property Alert - ${properties.length} new listings found`,
    html: htmlContent,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log("Email sent successfully to:", recipientEmail)
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

function generateEmailHTML(properties: Property[], criteria: any): string {
  const neighborhoodsText = criteria.neighborhoods?.join(", ") || "All"
  const priceFilter = criteria.maxPricePerM2 ? `Max $${criteria.maxPricePerM2}/m²` : "No limit"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Property Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .property { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
        .property-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .property-details { display: flex; gap: 20px; margin-bottom: 10px; }
        .property-detail { font-size: 14px; }
        .price { color: #28a745; font-weight: bold; }
        .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Property Alert - ${properties.length} New Listings</h1>
          <p><strong>Search Criteria:</strong></p>
          <ul>
            <li>Neighborhoods: ${neighborhoodsText}</li>
            <li>Price Filter: ${priceFilter}</li>
            <li>Owner Only: ${criteria.ownerOnly ? "Yes" : "No"}</li>
          </ul>
        </div>
        
        ${properties
          .map(
            (property) => `
          <div class="property">
            <div class="property-title">${property.title}</div>
            <div class="property-details">
              <span class="property-detail price">$${property.totalPrice.toLocaleString()}</span>
              <span class="property-detail">${property.surface}m²</span>
              <span class="property-detail">$${property.pricePerM2}/m²</span>
              <span class="property-detail">${property.source}</span>
            </div>
            <a href="${property.link}" class="button" target="_blank">View Property</a>
          </div>
        `,
          )
          .join("")}
        
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          This email was sent by Property Finder Argentina. 
          To unsubscribe or modify your alerts, please contact us.
        </p>
      </div>
    </body>
    </html>
  `
}
