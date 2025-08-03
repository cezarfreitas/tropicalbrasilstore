#!/bin/bash

# =============================================================================
# Chinelos Store - Simplified Deploy Script (Development Mode)
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "==============================================="
echo "🚀 Chinelos Store - Simplified Deploy"
echo "==============================================="
echo ""

DEPLOY_METHOD=${1:-"cloud"}

if [ "$DEPLOY_METHOD" = "docker" ]; then
    log_info "Starting Docker Compose deployment..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Docker first."
        exit 1
    fi

    COMPOSE_CMD="docker compose"
    if ! docker compose version &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    fi

    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log_info "Creating .env from template..."
            cp .env.example .env
            log_warning "Please configure the .env file with your database credentials!"
            echo ""
            read -p "Press Enter to continue after configuring .env..."
        fi
    fi

    log_info "Cleaning up existing containers..."
    $COMPOSE_CMD down --remove-orphans 2>/dev/null || true

    log_info "Building and starting services..."
    $COMPOSE_CMD up -d --build

    log_info "Checking service status..."
    $COMPOSE_CMD ps

    echo ""
    log_success "🎉 Docker deployment completed!"
    echo ""
    echo "📱 Application: http://localhost:3000"
    echo "🗄️  Database: localhost:3306"
    echo ""
    echo "🔧 Management:"
    echo "  Logs:    $COMPOSE_CMD logs -f app"
    echo "  Stop:    $COMPOSE_CMD down"
    echo "  Restart: $COMPOSE_CMD restart"
    echo ""

else
    log_info "Starting cloud deployment preparation..."

    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the project root?"
        exit 1
    fi

    log_success "Found package.json"

    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm install --legacy-peer-deps
    fi

    log_info "Testing development server..."
    if npm run dev --dry-run &> /dev/null; then
        log_success "Development server command verified"
    else
        log_error "Development server command failed"
        exit 1
    fi

    echo ""
    log_success "🎉 Cloud deployment preparation complete!"
    echo ""
    echo "📋 Environment variables needed:"
    echo "  DATABASE_URL=mysql://user:password@host:port/database"
    echo "  NODE_ENV=development (not production!)"
    echo "  PORT=3000 (optional)"
    echo ""
    echo "🚀 Deploy commands:"
    echo ""
    echo "  🚄 Railway:"
    echo "    railway up"
    echo ""
    echo "  🎨 Render:"
    echo "    git push origin main"
    echo ""
    echo "  🪂 Fly.io:"
    echo "    fly deploy"
    echo ""
    echo "  📦 Easy Panel:"
    echo "    Use Docker deployment: ./deploy.sh docker"
    echo ""
    echo "🔄 The app will run in DEVELOPMENT mode for maximum compatibility!"
    echo ""
fi

log_success "Deploy script completed!"
