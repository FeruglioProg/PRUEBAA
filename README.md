# 🏠 Property Finder Argentina - Servidor Dedicado

Sistema completo de scraping de propiedades inmobiliarias en Argentina con arquitectura profesional.

## 🚀 Instalación Súper Rápida (1 comando)

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/tu-repo/property-finder/main/quick-install.sh | bash
\`\`\`

## 📋 Instalación Manual

### 1. Preparar el servidor
\`\`\`bash
wget https://raw.githubusercontent.com/tu-repo/property-finder/main/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
\`\`\`

### 2. Configurar la aplicación
\`\`\`bash
./configure-app.sh
\`\`\`

### 3. Construir y desplegar
\`\`\`bash
./build-and-deploy.sh
\`\`\`

## 🛠️ Gestión de la Aplicación

\`\`\`bash
# Ver todos los comandos disponibles
./manage.sh help

# Comandos más comunes
./manage.sh start      # Iniciar servicios
./manage.sh stop       # Detener servicios
./manage.sh logs       # Ver logs en tiempo real
./manage.sh status     # Ver estado de servicios
./manage.sh backup     # Crear backup de BD
./manage.sh monitor    # Abrir dashboard
\`\`\`

## 🌐 Acceso a la Aplicación

- **Aplicación Web**: http://localhost:3000
- **Dashboard Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090

## ⚙️ Configuración

Edita el archivo `.env` para configurar:

\`\`\`bash
# Gmail para notificaciones
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password

# Proxy Bright Data (opcional)
PROXY_HOST=brd.superproxy.io
PROXY_PORT=33335
PROXY_USERNAME=tu-usuario
PROXY_PASSWORD=tu-password
\`\`\`

## 🏗️ Arquitectura

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Scraper Worker │    │   PostgreSQL    │
│   (Puerto 3000) │    │   (Background)  │    │   (Puerto 5432) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │      Redis      │
                    │   (Puerto 6379) │
                    └─────────────────┘
\`\`\`

## 📊 Monitoreo

- **Métricas en tiempo real** con Prometheus
- **Dashboards visuales** con Grafana
- **Alertas automáticas** para problemas
- **Logs centralizados** de todos los servicios

## 🔧 Mantenimiento

### Backup automático
\`\`\`bash
./manage.sh backup
\`\`\`

### Actualizar aplicación
\`\`\`bash
./manage.sh update
\`\`\`

### Ver logs específicos
\`\`\`bash
docker-compose logs -f app
docker-compose logs -f worker
\`\`\`

### Escalar workers
\`\`\`bash
docker-compose up -d --scale worker=3
\`\`\`

## 🚨 Solución de Problemas

### Servicios no inician
\`\`\`bash
./manage.sh status
docker-compose logs
\`\`\`

### Problemas de memoria
\`\`\`bash
# Aumentar memoria para Docker
# En Docker Desktop: Settings > Resources > Memory > 4GB+
\`\`\`

### Limpiar sistema
\`\`\`bash
./manage.sh clean
\`\`\`

## 📈 Rendimiento

- **Sin timeouts**: Scraping ilimitado en tiempo
- **Procesamiento paralelo**: Múltiples workers
- **Caché inteligente**: Resultados rápidos
- **Proxies rotativos**: Evita bloqueos
- **Base de datos optimizada**: Consultas rápidas

## 🔒 Seguridad

- **Contenedores aislados**
- **Usuarios no-root**
- **Datos encriptados**
- **Backups automáticos**
- **Monitoreo de seguridad**

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs: `./manage.sh logs`
2. Verifica el estado: `./manage.sh status`
3. Reinicia servicios: `./manage.sh restart`
4. Limpia y reinstala: `./manage.sh clean && ./build-and-deploy.sh`

---

🎉 **¡Disfruta de tu sistema de scraping profesional!**
