#!/bin/bash

# 🔧 Script de configuración de la aplicación

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Docker funciona
if ! docker --version &> /dev/null; then
    print_error "Docker no está disponible. Ejecuta primero ./setup-server.sh y reinicia la sesión"
    exit 1
fi

print_status "Configurando Property Finder Argentina..."

# Crear archivo .env
print_status "Creando configuración de entorno..."
cat > .env << 'EOF'
# Base de datos
DATABASE_URL=postgresql://postgres:propertypass123@localhost:5432/property_finder

# Redis
REDIS_URL=redis://localhost:6379

# Gmail (CONFIGURA ESTOS VALORES)
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password

# Proxy Bright Data (OPCIONAL - CONFIGURA SI TIENES)
PROXY_HOST=brd.superproxy.io
PROXY_PORT=33335
PROXY_USERNAME=tu-usuario-bright-data
PROXY_PASSWORD=tu-password-bright-data
PROXY_PROTOCOL=http

# Configuración de scraping
SCRAPING_DELAY_MIN=1000
SCRAPING_DELAY_MAX=3000
MAX_CONCURRENT_PAGES=3
BROWSER_TIMEOUT=30000
METRICS_PORT=3001

# Next.js
NEXTAUTH_SECRET=tu-secret-super-seguro-aqui
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=production
EOF

# Crear package.json
print_status "Creando package.json..."
cat > package.json << 'EOF'
{
  "name": "property-finder-argentina",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "worker": "node server/worker/index.js"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.6.0",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.294.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.7",
    "nodemailer": "^6.9.7",
    "node-cron": "^3.0.3",
    "puppeteer": "^21.6.1",
    "puppeteer-extra": "^3.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "puppeteer-extra-plugin-adblocker": "^2.13.6",
    "cheerio": "^1.0.0-rc.12",
    "redis": "^4.6.10",
    "uuid": "^9.0.1",
    "prom-client": "^15.1.0",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "@types/node": "^20.8.10",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@types/nodemailer": "^6.4.14",
    "@types/uuid": "^9.0.7",
    "prisma": "^5.6.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "eslint": "^8.53.0",
    "eslint-config-next": "15.0.0"
  }
}
EOF

# Crear next.config.js
print_status "Creando configuración de Next.js..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-extra', 'puppeteer-extra-plugin-stealth']
  },
  output: 'standalone',
  images: {
    domains: ['placeholder.svg']
  }
}

module.exports = nextConfig
EOF

# Crear docker-compose.yml
print_status "Creando configuración de Docker..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Base de datos PostgreSQL
  postgres:
    image: postgres:15
    restart: always
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=propertypass123
      - POSTGRES_DB=property_finder
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis para colas y caché
  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Aplicación Next.js
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:propertypass123@postgres:5432/property_finder
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads

  # Worker de scraping
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    restart: always
    environment:
      - DATABASE_URL=postgresql://postgres:propertypass123@postgres:5432/property_finder
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      replicas: 2

  # Monitoreo con Prometheus
  prometheus:
    image: prom/prometheus:latest
    restart: always
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  # Dashboard con Grafana
  grafana:
    image: grafana/grafana:latest
    restart: always
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    depends_on:
      - prometheus

volumes:
  postgres-data:
  redis-data:
  prometheus-data:
  grafana-data:
EOF

print_success "✅ Configuración básica completada"
print_status "Ejecuta: ./build-and-deploy.sh para construir y desplegar la aplicación"
