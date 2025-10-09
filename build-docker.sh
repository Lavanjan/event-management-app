#!/bin/bash

# ==============================================
# Docker Image Build Script
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

# Configuration
IMAGE_NAME="event-booking-system"
VERSION=${1:-latest}
REGISTRY=${2:-}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to build images
build_images() {
    print_status "Building Docker images..."

    # Build backend image
    print_status "Building backend image..."
    docker build -f apps/backend/Dockerfile -t ${IMAGE_NAME}-backend:${VERSION} .

    # Build frontend image
    print_status "Building frontend image..."
    docker build -f apps/frontend/Dockerfile -t ${IMAGE_NAME}-frontend:${VERSION} \
        --build-arg VITE_API_URL=${VITE_API_URL:-/api} \
        --build-arg VITE_APP_NAME="${VITE_APP_NAME:-Event Booking System}" .

    print_success "Docker images built successfully!"
}

# Function to tag images for registry
tag_images() {
    if [ -n "$REGISTRY" ]; then
        print_status "Tagging images for registry: $REGISTRY"
        
        docker tag ${IMAGE_NAME}-backend:${VERSION} ${REGISTRY}/${IMAGE_NAME}-backend:${VERSION}
        docker tag ${IMAGE_NAME}-frontend:${VERSION} ${REGISTRY}/${IMAGE_NAME}-frontend:${VERSION}
        
        # Also tag as latest if version is not latest
        if [ "$VERSION" != "latest" ]; then
            docker tag ${IMAGE_NAME}-backend:${VERSION} ${REGISTRY}/${IMAGE_NAME}-backend:latest
            docker tag ${IMAGE_NAME}-frontend:${VERSION} ${REGISTRY}/${IMAGE_NAME}-frontend:latest
        fi
        
        print_success "Images tagged for registry"
    fi
}

# Function to push images to registry
push_images() {
    if [ -n "$REGISTRY" ]; then
        print_status "Pushing images to registry: $REGISTRY"
        
        docker push ${REGISTRY}/${IMAGE_NAME}-backend:${VERSION}
        docker push ${REGISTRY}/${IMAGE_NAME}-frontend:${VERSION}
        
        if [ "$VERSION" != "latest" ]; then
            docker push ${REGISTRY}/${IMAGE_NAME}-backend:latest
            docker push ${REGISTRY}/${IMAGE_NAME}-frontend:latest
        fi
        
        print_success "Images pushed to registry"
    fi
}

# Function to save images to tar files
save_images() {
    print_status "Saving images to tar files..."
    
    docker save ${IMAGE_NAME}-backend:${VERSION} | gzip > ${IMAGE_NAME}-backend-${VERSION}.tar.gz
    docker save ${IMAGE_NAME}-frontend:${VERSION} | gzip > ${IMAGE_NAME}-frontend-${VERSION}.tar.gz
    
    print_success "Images saved to:"
    echo "  - ${IMAGE_NAME}-backend-${VERSION}.tar.gz"
    echo "  - ${IMAGE_NAME}-frontend-${VERSION}.tar.gz"
}

# Function to show image sizes
show_image_info() {
    print_status "Image information:"
    docker images | grep ${IMAGE_NAME}
}

# Function to clean up build cache
cleanup() {
    print_status "Cleaning up build cache..."
    docker builder prune -f
    print_success "Build cache cleaned"
}

# Function to show help
show_help() {
    echo "Docker Image Build Script"
    echo ""
    echo "Usage: $0 [VERSION] [REGISTRY]"
    echo ""
    echo "Arguments:"
    echo "  VERSION   - Image version tag (default: latest)"
    echo "  REGISTRY  - Docker registry URL (optional)"
    echo ""
    echo "Examples:"
    echo "  $0                              # Build with 'latest' tag"
    echo "  $0 v1.0.0                       # Build with 'v1.0.0' tag"
    echo "  $0 v1.0.0 myregistry.com        # Build and push to registry"
    echo ""
    echo "Environment Variables:"
    echo "  VITE_API_URL    - Frontend API URL (default: http://localhost:3000/api)"
    echo "  VITE_APP_NAME   - Application name (default: Event Booking System)"
    echo ""
    echo "The script will:"
    echo "  1. Build backend and frontend Docker images"
    echo "  2. Tag images for registry (if provided)"
    echo "  3. Save images as tar.gz files for manual transfer"
    echo "  4. Show image information"
}

# Main script logic
main() {
    local command=${1:-build}
    
    case $command in
        build|"")
            check_docker
            build_images
            tag_images
            save_images
            show_image_info
            print_success "Build completed successfully!"
            print_status "You can now transfer the .tar.gz files to your VPS"
            ;;
        push)
            if [ -z "$REGISTRY" ]; then
                print_error "Registry URL is required for push command"
                exit 1
            fi
            check_docker
            push_images
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            # If first argument is not a command, treat it as version
            VERSION=$1
            REGISTRY=$2
            check_docker
            build_images
            tag_images
            save_images
            show_image_info
            print_success "Build completed successfully!"
            print_status "You can now transfer the .tar.gz files to your VPS"
            ;;
    esac
}

# Run main function with all arguments
main "$@"
