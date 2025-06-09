#!/bin/bash

# Script para desplegar la aplicación en un servidor dedicado

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Docker no está instalado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose no está instalado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "Creando archivo .env..."
    cat > .env << EOF
# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Proxy Configuration (Optional)
PROXY_HOST=brd.superproxy.io
PROXY_PORT=33335
PROXY_USERNAME=brd-customer-hl_c04d5276-zone-datacenter_proxy1
PROXY_PASSWORD=i27ypnprmfw5
PROXY_PROTOCOL=http
EOF
    echo "Archivo .env creado. Por favor, edítalo con tus credenciales."
fi

# Construir y levantar los contenedores
echo "Construyendo y levantando contenedores..."
docker-compose up -d --build

echo "Aplicación desplegada correctamente."
echo "Accede a la aplicación en: http://localhost:3000"
echo "Accede a Grafana en: http://localhost:3001 (usuario: admin, contraseña: admin)"
