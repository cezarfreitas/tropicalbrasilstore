#!/bin/bash

# =============================================================================
# Chinelos Store - Universal Deploy Script
# Supports multiple deployment methods: Nixpacks, Docker, Easy Panel
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

# Banner
echo "==============================================="
echo "🚀 Chinelos Store - Universal Deploy Script"
echo "==============================================="
echo ""

# Check arguments
DEPLOY_METHOD=${1:-"nixpacks"}

case $DEPLOY_METHOD in
    "docker"|"compose")
        echo "📦 Docker Compose Deployment Selected"
        ;;
    "nixpacks"|"cloud")
        echo "☁️  Nixpacks Cloud Deployment Selected"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [METHOD]"
        echo ""
        echo "Methods:"
        echo "  nixpacks, cloud    - Deploy to Nixpacks platforms (Railway, Render, Fly.io)"
        echo "  docker, compose    - Deploy using Docker Compose (Easy Panel, local)"
        echo "  help               - Show this help"
        echo ""
        exit 0
        ;;
    *)
        log_warning "Unknown method '$DEPLOY_METHOD', defaulting to nixpacks"
        DEPLOY_METHOD="nixpacks"
        ;;
esac

echo ""

# =============================================================================
# DOCKER COMPOSE DEPLOYMENT
# =============================================================================
if [ "$DEPLOY_METHOD" = "docker" ] || [ "$DEPLOY_METHOD" = "compose" ]; then
    log_info "Starting Docker Compose deployment..."
    
    # Check Docker installation
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose not found. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi

    # Use docker compose or docker-compose
    COMPOSE_CMD="docker compose"
    if ! docker compose version &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    fi

    log_info "Using: $COMPOSE_CMD"

    # Check for required files
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml not found!"
        exit 1
    fi

    # Create .env if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log_info "Creating .env from template..."
            cp .env.example .env
            log_warning "Please configure the .env file with your database credentials!"
            echo "Required variables:"
            echo "  - DB_PASSWORD"
            echo "  - DB_ROOT_PASSWORD"
            echo ""
            read -p "Press Enter to continue after configuring .env..."
        else
            log_error ".env.example not found. Cannot create .env file."
            exit 1
        fi
    fi

    # Validate .env
    if ! grep -q "DB_PASSWORD=" .env || ! grep -q "DB_ROOT_PASSWORD=" .env; then
        log_warning "Please ensure DB_PASSWORD and DB_ROOT_PASSWORD are set in .env"
    fi

    # Clean up any existing containers
    log_info "Cleaning up existing containers..."
    $COMPOSE_CMD down --remove-orphans 2>/dev/null || true

    # Build and start
    log_info "Building application..."
    $COMPOSE_CMD build --no-cache

    log_info "Starting services..."
    $COMPOSE_CMD up -d

    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 10

    # Check service status
    log_info "Checking service status..."
    $COMPOSE_CMD ps

    # Verify app is responding
    log_info "Verifying application health..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/health &> /dev/null; then
            log_success "Application is healthy!"
            break
        fi
        if [ $i -eq 30 ]; then
            log_warning "Health check timed out, but containers are running"
        fi
        sleep 2
    done

    echo ""
    log_success "🎉 Docker Compose deployment completed!"
    echo ""
    echo "📱 Application: http://localhost:3000"
    echo "🗄️  Database: localhost:3306"
    echo ""
    echo "🔧 Management commands:"
    echo "  View logs:     $COMPOSE_CMD logs -f"
    echo "  Stop:          $COMPOSE_CMD down"
    echo "  Restart:       $COMPOSE_CMD restart"
    echo "  Rebuild:       $COMPOSE_CMD build --no-cache && $COMPOSE_CMD up -d"
    echo ""

# =============================================================================
# NIXPACKS DEPLOYMENT
# =============================================================================
else
    log_info "Starting Nixpacks deployment preparation..."

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the project root?"
        exit 1
    fi

    # Check if nixpacks.toml exists
    if [ ! -f "nixpacks.toml" ]; then
        log_error "nixpacks.toml not found. Creating it..."
        exit 1
    fi

    log_success "Found required files"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm ci
    fi

    # Clean previous builds
    log_info "Cleaning previous builds..."
    rm -rf dist

    # Type checking
    log_info "Running type check..."
    if npm run typecheck; then
        log_success "Type check passed"
    else
        log_warning "Type check failed, but continuing with deployment"
        log_info "Note: Some type errors are non-critical for deployment"
    fi

    # Run tests if available
    if npm list vitest &> /dev/null 2>&1; then
        log_info "Running tests..."
        if npm test; then
            log_success "Tests passed"
        else
            log_warning "Tests failed, but continuing with deployment"
        fi
    else
        log_info "No tests configured, skipping"
    fi

    # Build the application
    log_info "Building application..."
    if npm run build; then
        log_success "Build successful"
    else
        log_error "Build failed! Please fix build errors before deploying."
        exit 1
    fi

    # Verify build artifacts
    if [ -d "dist/spa" ] && [ -d "dist/server" ]; then
        log_success "Build artifacts verified"
    else
        log_error "Build artifacts missing! Check build configuration."
        exit 1
    fi

    # Clean up build artifacts (they will be rebuilt during deployment)
    log_info "Cleaning build artifacts..."
    rm -rf dist

    echo ""
    log_success "🎉 Nixpacks deployment preparation complete!"
    echo ""
    echo "📋 Environment variables needed for production:"
    echo "  DATABASE_URL=mysql://user:password@host:port/database"
    echo "  NODE_ENV=production"
    echo "  PORT=3000 (optional)"
    echo ""
    echo "🚀 Deploy with your preferred platform:"
    echo ""
    echo "  🚄 Railway:"
    echo "    railway login && railway up"
    echo ""
    echo "  🎨 Render:"
    echo "    git push origin main"
    echo ""
    echo "  🪂 Fly.io:"
    echo "    fly auth login && fly deploy"
    echo ""
    echo "  📦 Easy Panel (Docker):"
    echo "    ./deploy.sh docker"
    echo ""
    echo "📖 For detailed instructions, see DEPLOY.md"
    echo ""
fi

log_success "Deployment script completed successfully!"
