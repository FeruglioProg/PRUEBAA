#!/bin/bash

# 🏗️ Script de construcción y despliegue

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

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    print_error "No se encontró docker-compose.yml. Ejecuta primero ./configure-app.sh"
    exit 1
fi

print_status "🏗️ Construyendo y desplegando Property Finder Argentina..."

# Crear directorios necesarios
print_status "Creando directorios necesarios..."
mkdir -p {scripts,monitoring,uploads,server/worker}

# Crear script de inicialización de base de datos
print_status "Creando script de base de datos..."
cat > scripts/init-db.sql << 'EOF'
-- Inicialización de la base de datos Property Finder Argentina

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de propiedades
CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    surface DECIMAL(10, 2) NOT NULL,
    price_per_m2 DECIMAL(15, 2) NOT NULL,
    source VARCHAR(50) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    published_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);
CREATE INDEX IF NOT EXISTS idx_properties_price_per_m2 ON properties(price_per_m2);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- Tabla de búsquedas programadas
CREATE TABLE IF NOT EXISTS scheduled_searches (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL,
    schedule_time VARCHAR(5) NOT NULL,
    neighborhoods TEXT[] NOT NULL,
    owner_only BOOLEAN NOT NULL DEFAULT FALSE,
    time_range VARCHAR(10) NOT NULL,
    custom_start_date DATE,
    custom_end_date DATE,
    max_price_per_m2 DECIMAL(15, 2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas programadas
CREATE INDEX IF NOT EXISTS idx_scheduled_searches_email ON scheduled_searches(email);
CREATE INDEX IF NOT EXISTS idx_scheduled_searches_is_active ON scheduled_searches(is_active);

-- Tabla de trabajos de scraping
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id VARCHAR(255) PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    criteria JSONB NOT NULL,
    result JSONB,
    error TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para trabajos de scraping
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_searches_updated_at BEFORE UPDATE ON scheduled_searches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo
INSERT INTO properties (id, title, link, total_price, surface, price_per_m2, source, neighborhood, is_owner, published_date) VALUES
('example-1', 'Departamento 2 ambientes en Palermo', 'https://www.zonaprop.com.ar/ejemplo-1', 180000, 65, 2769, 'Zonaprop', 'Palermo', true, NOW()),
('example-2', 'Monoambiente en Belgrano', 'https://www.argenprop.com/ejemplo-2', 120000, 45, 2667, 'Argenprop', 'Belgrano', false, NOW()),
('example-3', 'Departamento en Recoleta', 'https://inmuebles.mercadolibre.com.ar/ejemplo-3', 250000, 85, 2941, 'MercadoLibre', 'Recoleta', true, NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;
EOF

# Crear configuración de Prometheus
print_status "Creando configuración de monitoreo..."
mkdir -p monitoring
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/api/metrics'

  - job_name: 'worker'
    static_configs:
      - targets: ['worker:3001']
    metrics_path: '/metrics'
EOF

# Crear Dockerfile principal
print_status "Creando Dockerfile principal..."
cat > Dockerfile << 'EOF'
# Dockerfile para la aplicación Next.js
FROM node:18-alpine AS base

# Instalar dependencias del sistema necesarias para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Configurar Puppeteer para usar Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Instalar dependencias
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Construir la aplicación
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar Prisma client
RUN npx prisma generate

# Construir Next.js
RUN npm run build

# Imagen de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
EOF

# Crear Dockerfile para worker
print_status "Creando Dockerfile para worker..."
cat > Dockerfile.worker << 'EOF'
# Dockerfile para el worker de scraping
FROM node:18-alpine

# Instalar Chromium y dependencias
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

# Configurar Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copiar package.json y instalar dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Generar Prisma client
RUN npx prisma generate

# Crear usuario no-root
RUN addgroup --system --gid 1001 worker
RUN adduser --system --uid 1001 worker
RUN chown -R worker:worker /app

USER worker

EXPOSE 3001

# Usar dumb-init para manejo correcto de señales
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/worker/index.js"]
EOF

# Detener servicios existentes si están corriendo
print_status "Deteniendo servicios existentes..."
docker-compose down --remove-orphans 2>/dev/null || true

# Construir y levantar servicios
print_status "Construyendo imágenes Docker..."
docker-compose build --no-cache

print_status "Levantando servicios..."
docker-compose up -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
print_status "Verificando estado de los servicios..."
docker-compose ps

# Mostrar logs iniciales
print_status "Mostrando logs iniciales..."
docker-compose logs --tail=20

print_success "🎉 ¡Despliegue completado exitosamente!"
echo ""
print_success "🌐 Aplicación disponible en: http://localhost:3000"
print_success "📊 Grafana disponible en: http://localhost:3001 (admin/admin123)"
print_success "🔍 Prometheus disponible en: http://localhost:9090"
echo ""
print_warning "📝 Recuerda configurar tus credenciales en el archivo .env:"
print_warning "   - GMAIL_USER y GMAIL_APP_PASSWORD para notificaciones"
print_warning "   - Credenciales de proxy si tienes Bright Data"
echo ""
print_status "Para ver logs en tiempo real: docker-compose logs -f"
print_status "Para reiniciar servicios: docker-compose restart"
print_status "Para detener todo: docker-compose down"
