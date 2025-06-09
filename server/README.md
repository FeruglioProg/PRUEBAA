# Property Finder Argentina - Servidor Dedicado

Este es el servidor dedicado para la aplicación Property Finder Argentina, que permite realizar scraping en tiempo real de propiedades en Argentina.

## Requisitos

- Servidor Linux (Ubuntu 20.04 o superior recomendado)
- Docker y Docker Compose
- Al menos 4GB de RAM
- Al menos 20GB de espacio en disco

## Instalación

1. Clona este repositorio en tu servidor:

\`\`\`bash
git clone https://github.com/tu-usuario/property-finder-argentina.git
cd property-finder-argentina
\`\`\`

2. Ejecuta el script de despliegue:

\`\`\`bash
chmod +x server/deploy.sh
./server/deploy.sh
\`\`\`

3. Edita el archivo `.env` con tus credenciales:

\`\`\`bash
nano .env
\`\`\`

4. Reinicia los contenedores para aplicar los cambios:

\`\`\`bash
docker-compose down
docker-compose up -d
\`\`\`

## Arquitectura

La aplicación está compuesta por los siguientes servicios:

- **nextjs**: Aplicación web Next.js
- **postgres**: Base de datos PostgreSQL
- **redis**: Caché y sistema de colas
- **scraper-worker**: Worker para realizar scraping en segundo plano
- **prometheus**: Sistema de monitoreo
- **grafana**: Dashboard para visualizar métricas

## Monitoreo

Puedes acceder al dashboard de Grafana en `http://tu-servidor:3001` con las siguientes credenciales:

- Usuario: admin
- Contraseña: admin

## Mantenimiento

### Logs

Para ver los logs de un servicio:

\`\`\`bash
docker-compose logs -f nextjs
docker-compose logs -f scraper-worker
\`\`\`

### Reiniciar servicios

\`\`\`bash
docker-compose restart nextjs
docker-compose restart scraper-worker
\`\`\`

### Actualizar la aplicación

\`\`\`bash
git pull
docker-compose down
docker-compose up -d --build
\`\`\`

## Configuración avanzada

### Proxies

Para configurar proxies adicionales, edita el archivo `lib/proxy-manager.ts` y añade tus proxies a la lista.

### Escalado

Para escalar el número de workers:

\`\`\`bash
docker-compose up -d --scale scraper-worker=3
\`\`\`

### Backup de la base de datos

\`\`\`bash
docker-compose exec postgres pg_dump -U postgres property_finder > backup.sql
