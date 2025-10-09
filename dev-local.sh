#!/bin/bash

# ==============================================
# Local Development Script
# ==============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Setup environment
setup_env() {
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from local template..."
        cp .env.local .env
        print_success ".env file created"
    else
        print_status ".env file already exists"
    fi
}

# Build images
build_images() {
    print_status "Building Docker images for local development..."
    docker-compose -f docker-compose.local.yml build --no-cache
    print_success "Docker images built successfully"
}

# Start services
start_services() {
    print_status "Starting local development services..."
    docker-compose -f docker-compose.local.yml up -d
    print_success "Services started successfully"
}

# Stop services
stop_services() {
    print_status "Stopping local development services..."
    docker-compose -f docker-compose.local.yml down
    print_success "Services stopped successfully"
}

# Show service status
show_status() {
    print_status "Local development service status:"
    docker-compose -f docker-compose.local.yml ps
}

# Show logs
show_logs() {
    local service=${1:-}
    if [ -n "$service" ]; then
        print_status "Showing logs for $service..."
        docker-compose -f docker-compose.local.yml logs -f "$service"
    else
        print_status "Showing logs for all services..."
        docker-compose -f docker-compose.local.yml logs -f
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    docker-compose -f docker-compose.local.yml exec backend npm run typeorm:run
    print_success "Database migrations completed"
}

# Seed database
seed_database() {
    print_status "Seeding database..."
    docker-compose -f docker-compose.local.yml exec backend npm run seed
    print_success "Database seeded successfully"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait a bit for services to be ready
    sleep 5
    
    # Check backend health
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
    fi
    
    # Check frontend health
    if curl -f http://localhost:4200/health >/dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_error "Frontend health check failed"
    fi
}

# Save images for production
save_images() {
    print_status "Saving Docker images for production deployment..."
    
    # Tag images for production
    docker tag event-management-app-backend:latest event-booking-system-backend:latest
    docker tag event-management-app-frontend:latest event-booking-system-frontend:latest
    
    # Save images
    docker save event-booking-system-backend:latest | gzip > event-booking-system-backend-latest.tar.gz
    docker save event-booking-system-frontend:latest | gzip > event-booking-system-frontend-latest.tar.gz
    
    print_success "Images saved for production:"
    echo "  - event-booking-system-backend-latest.tar.gz"
    echo "  - event-booking-system-frontend-latest.tar.gz"
    print_status "You can transfer these files to your VPS for deployment"
}

# Clean up
cleanup() {
    print_status "Cleaning up local development environment..."
    docker-compose -f docker-compose.local.yml down -v
    docker system prune -f
    print_success "Cleanup completed"
}

# Show help
show_help() {
    echo "Local Development Script for Event Booking System"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup       - Setup local development environment"
    echo "  build       - Build Docker images"
    echo "  start       - Start services"
    echo "  stop        - Stop services"
    echo "  restart     - Restart services"
    echo "  status      - Show service status"
    echo "  logs [service] - Show logs (optionally for specific service)"
    echo "  migrate     - Run database migrations"
    echo "  seed        - Seed database"
    echo "  health      - Perform health check"
    echo "  save        - Save images for production deployment"
    echo "  cleanup     - Clean up everything (removes data)"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup            # Setup and start everything"
    echo "  $0 logs backend     # Show backend logs"
    echo "  $0 save             # Save images for VPS deployment"
}

# Main script logic
main() {
    local command=${1:-help}
    
    case $command in
        setup)
            check_prerequisites
            setup_env
            build_images
            start_services
            sleep 15  # Wait for services to start
            run_migrations
            seed_database
            health_check
            show_status
            print_success "Local development environment setup completed!"
            print_status "Frontend: http://localhost:4200"
            print_status "Backend API: http://localhost:3000/api"
            print_status "API Documentation: http://localhost:3000/api/docs"
            ;;
        build)
            check_prerequisites
            setup_env
            build_images
            ;;
        start)
            check_prerequisites
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            start_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        migrate)
            run_migrations
            ;;
        seed)
            seed_database
            ;;
        health)
            health_check
            ;;
        save)
            save_images
            ;;
        cleanup)
            cleanup
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
