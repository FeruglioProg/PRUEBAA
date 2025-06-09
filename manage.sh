#!/bin/bash

# 🛠️ Script de gestión de la aplicación

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

show_help() {
    echo "🛠️  Property Finder Argentina - Gestión"
    echo ""
    echo "Uso: ./manage.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start       - Iniciar todos los servicios"
    echo "  stop        - Detener todos los servicios"
    echo "  restart     - Reiniciar todos los servicios"
    echo "  logs        - Ver logs en tiempo real"
    echo "  status      - Ver estado de los servicios"
    echo "  update      - Actualizar y reconstruir la aplicación"
    echo "  backup      - Crear backup de la base de datos"
    echo "  restore     - Restaurar backup de la base de datos"
    echo "  clean       - Limpiar contenedores y volúmenes"
    echo "  monitor     - Abrir dashboard de monitoreo"
    echo "  config      - Editar configuración"
    echo "  help        - Mostrar esta ayuda"
}

start_services() {
    print_status "Iniciando servicios..."
    docker-compose up -d
    print_success "Servicios iniciados"
    docker-compose ps
}

stop_services() {
    print_status "Deteniendo servicios..."
    docker-compose down
    print_success "Servicios detenidos"
}

restart_services() {
    print_status "Reiniciando servicios..."
    docker-compose restart
    print_success "Servicios reiniciados"
    docker-compose ps
}

show_logs() {
    print_status "Mostrando logs en tiempo real (Ctrl+C para salir)..."
    docker-compose logs -f
}

show_status() {
    print_status "Estado de los servicios:"
    docker-compose ps
    echo ""
    print_status "Uso de recursos:"
    docker stats --no-stream
}

update_app() {
    print_status "Actualizando aplicación..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    print_success "Aplicación actualizada"
}

backup_db() {
    print_status "Creando backup de la base de datos..."
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U postgres property_finder > "$BACKUP_FILE"
    print_success "Backup creado: $BACKUP_FILE"
}

restore_db() {
    if [ -z "$2" ]; then
        print_error "Especifica el archivo de backup: ./manage.sh restore backup_file.sql"
        exit 1
    fi
    
    if [ ! -f "$2" ]; then
        print_error "Archivo de backup no encontrado: $2"
        exit 1
    fi
    
    print_warning "⚠️  Esto sobrescribirá la base de datos actual. ¿Continuar? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Restaurando backup..."
        docker-compose exec -T postgres psql -U postgres -d property_finder < "$2"
        print_success "Backup restaurado"
    else
        print_status "Operación cancelada"
    fi
}

clean_system() {
    print_warning "⚠️  Esto eliminará todos los contenedores y volúmenes. ¿Continuar? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Limpiando sistema..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "Sistema limpiado"
    else
        print_status "Operación cancelada"
    fi
}

open_monitor() {
    print_status "Abriendo dashboard de monitoreo..."
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:3001
    elif command -v open > /dev/null; then
        open http://localhost:3001
    else
        print_success "Dashboard disponible en: http://localhost:3001"
        print_status "Usuario: admin, Contraseña: admin123"
    fi
}

edit_config() {
    if command -v nano > /dev/null; then
        nano .env
    elif command -v vim > /dev/null; then
        vim .env
    else
        print_status "Edita el archivo .env con tu editor preferido"
        print_status "Después ejecuta: ./manage.sh restart"
    fi
}

# Procesar comando
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    update)
        update_app
        ;;
    backup)
        backup_db
        ;;
    restore)
        restore_db "$@"
        ;;
    clean)
        clean_system
        ;;
    monitor)
        open_monitor
        ;;
    config)
        edit_config
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ -z "$1" ]; then
            show_help
        else
            print_error "Comando desconocido: $1"
            echo ""
            show_help
        fi
        exit 1
        ;;
esac
