# 🏠 Property Finder Argentina - Versión Simplificada

Esta es una versión simplificada del buscador de propiedades inmobiliarias en Argentina, sin dependencias de Redis ni sistemas de métricas complejos.

## 🚀 Instalación Rápida

1. **Clonar el repositorio**
\`\`\`bash
git clone https://github.com/tu-usuario/property-finder-argentina.git
cd property-finder-argentina
\`\`\`

2. **Instalar dependencias**
\`\`\`bash
npm install
\`\`\`

3. **Configurar variables de entorno**
Crea un archivo `.env.local` con:
\`\`\`
# Gmail (para envío de emails - opcional)
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password

# Proxy (opcional - para evitar bloqueos)
PROXY_HOST=tu-proxy-host
PROXY_PORT=tu-proxy-port
PROXY_USERNAME=tu-proxy-username
PROXY_PASSWORD=tu-proxy-password
\`\`\`

4. **Iniciar la aplicación**
\`\`\`bash
npm run dev
\`\`\`

5. **Acceder a la aplicación**
Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 🔍 Características

- **Búsqueda de propiedades** por barrio, precio y más
- **Scraping en tiempo real** de Zonaprop, Argenprop y MercadoLibre
- **Modo fallback** con datos simulados si el scraping falla
- **Programación de emails** (simulada en esta versión)
- **Interfaz responsive** con modo oscuro

## 📋 Uso

1. Selecciona los barrios que te interesan
2. Configura filtros adicionales (dueño directo, precio máximo)
3. Ingresa tu email
4. Haz clic en "Search Properties" para una búsqueda normal
5. Usa "LIVE Real-Time Search" para forzar scraping en tiempo real

## ⚠️ Limitaciones de la Versión Simplificada

- No hay persistencia de datos (no se guardan búsquedas)
- Los emails programados son simulados (no se envían realmente)
- No hay sistema de colas para trabajos en segundo plano
- No hay métricas ni monitoreo

## 🛠️ Solución de Problemas

- **El scraping falla**: Los sitios inmobiliarios pueden bloquear requests. Prueba configurando un proxy.
- **Errores de timeout**: El scraping puede tomar tiempo. La aplicación caerá en datos simulados automáticamente.

## 📝 Notas

Esta es una versión simplificada para uso personal o desarrollo. Para una versión completa con todas las funcionalidades, consulta el README principal.
\`\`\`

Finalmente, vamos a actualizar el archivo package.json para eliminar dependencias innecesarias:

```typescriptreact file="package.json"
[v0-no-op-code-block-prefix]{
  "name": "property-finder-simple",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.294.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.7",
    "nodemailer": "^6.9.7",
    "puppeteer": "^21.6.1",
    "puppeteer-extra": "^3.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "puppeteer-extra-plugin-adblocker": "^2.13.6",
    "cheerio": "^1.0.0-rc.12",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "@types/node": "^20.8.10",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@types/nodemailer": "^6.4.14",
    "@types/uuid": "^9.0.7",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "eslint": "^8.53.0",
    "eslint-config-next": "15.0.0"
  }
}
