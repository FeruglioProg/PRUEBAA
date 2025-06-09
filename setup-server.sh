#!/bin/bash

# 🚀 Script de instalación automática completa
# Property Finder Argentina - Servidor Dedicado

set -e  # Salir si hay algún error

echo "🚀 Iniciando instalación automática de Property Finder Argentina..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Verificar si se ejecuta como root
if [[ $EUID -eq 0 ]]; then
   print_error "Este script no debe ejecutarse como root"
   exit 1
fi

# Actualizar sistema
print_status "Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependencias básicas
print_status "Instalando dependencias básicas..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Docker
if ! command -v docker &> /dev/null; then
    print_status "Instalando Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER
    print_success "Docker instalado correctamente"
else
    print_success "Docker ya está instalado"
fi

# Instalar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_status "Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose instalado correctamente"
else
    print_success "Docker Compose ya está instalado"
fi

# Instalar Node.js (para desarrollo local si es necesario)
if ! command -v node &> /dev/null; then
    print_status "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js instalado correctamente"
else
    print_success "Node.js ya está instalado"
fi

# Crear directorio del proyecto
PROJECT_DIR="$HOME/property-finder-argentina"
if [ ! -d "$PROJECT_DIR" ]; then
    print_status "Creando directorio del proyecto..."
    mkdir -p "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Crear estructura de directorios
print_status "Creando estructura de directorios..."
mkdir -p {server,lib,app/api,components,prisma,scripts}

print_success "✅ Instalación de dependencias completada"
print_warning "⚠️  Necesitas cerrar sesión y volver a entrar para que los cambios de Docker tengan efecto"
print_status "Después ejecuta: cd $PROJECT_DIR && ./configure-app.sh"
