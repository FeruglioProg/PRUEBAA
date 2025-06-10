# 🚀 Guía de Despliegue - Property Finder Argentina

## Paso 1: Desplegar en Vercel

1. **Ve a [vercel.com](https://vercel.com)**
2. **Conecta tu GitHub**:
   - Sign up/Login con GitHub
   - Import Project
   - Selecciona tu repositorio `property-finder-argentina`

3. **Configurar el proyecto**:
   - Project Name: `property-finder-argentina`
   - Framework: Next.js (se detecta automáticamente)
   - Root Directory: `./` (por defecto)
   - Build Command: `npm run build`
   - Install Command: `npm install`

4. **Hacer clic en "Deploy"**

## Paso 2: Configurar Variables de Entorno en Vercel

Después del primer deploy (que fallará), ve a:

**Project Settings → Environment Variables**

Añade estas variables:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://zoolzzlufzoosgdlpkfh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvb2x6emx1Znpvb3NnZGxwa2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDg5MzUsImV4cCI6MjA2NTA4NDkzNX0.S3iw3XzB1ulJ5qZD_10CTiFaE7SU96oHnMjXvysWrmE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvb2x6emx1Znpvb3NnZGxwa2ZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUwODkzNSwiZXhwIjoyMDY1MDg0OTM1fQ.Gnhl7fBuS4-gEq6lvQKn2dcKWKOIuoQBb3NlKHLlnSo
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password-de-16-caracteres
\`\`\`

## Paso 3: Ejecutar Script SQL en Supabase

1. **Ve a tu proyecto Supabase**: https://supabase.com/dashboard
2. **SQL Editor** (en el menú lateral)
3. **Copia y pega** el contenido del archivo `scripts/init-supabase.sql`
4. **Haz clic en "Run"**

## Paso 4: Redesplegar

1. **Ve a Vercel Dashboard**
2. **Deployments tab**
3. **Redeploy** (botón con 3 puntos → Redeploy)

## ✅ ¡Listo!

Tu aplicación estará disponible en: `https://tu-proyecto.vercel.app`
