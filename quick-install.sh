#!/bin/bash

# 🚀 Instalación súper rápida de Property Finder Argentina
# Este script hace TODO automáticamente

set -e

echo "🚀 INSTALACIÓN AUTOMÁTICA DE PROPERTY FINDER ARGENTINA"
echo "======================================================"
echo ""
echo "Este script instalará y configurará todo automáticamente:"
echo "✅ Docker y Docker Compose"
echo "✅ Base de datos PostgreSQL"
echo "✅ Sistema de colas Redis"
echo "✅ Aplicación web Next.js"
echo "✅ Worker de scraping"
echo "✅ Sistema de monitoreo"
echo ""
read -p "¿Continuar con la instalación? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Instalación cancelada."
    exit 1
fi

# Crear directorio del proyecto
PROJECT_DIR="$HOME/property-finder-argentina"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Descargar scripts
echo "📥 Descargando scripts de instalación..."
curl -s -o setup-server.sh https://raw.githubusercontent.com/tu-repo/property-finder/main/setup-server.sh
curl -s -o configure-app.sh https://raw.githubusercontent.com/tu-repo/property-finder/main/configure-app.sh
curl -s -o build-and-deploy.sh https://raw.githubusercontent.com/tu-repo/property-finder/main/build-and-deploy.sh
curl -s -o manage.sh https://raw.githubusercontent.com/tu-repo/property-finder/main/manage.sh

# Hacer ejecutables
chmod +x *.sh

# Ejecutar instalación
echo "🔧 Ejecutando instalación del servidor..."
./setup-server.sh

echo ""
echo "⚠️  IMPORTANTE: Necesitas cerrar sesión y volver a entrar para que Docker funcione"
echo "Después ejecuta estos comandos:"
echo ""
echo "cd $PROJECT_DIR"
echo "./configure-app.sh"
echo "./build-and-deploy.sh"
echo ""
echo "🎉 ¡La instalación estará completa!"
