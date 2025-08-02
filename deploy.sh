#!/bin/bash

# Deploy script for Nixpacks
echo "🚀 Starting deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are you in the project root?"
    exit 1
fi

# Check if nixpacks.toml exists
if [ ! -f "nixpacks.toml" ]; then
    echo "⚠️  nixpacks.toml not found. Creating it from backup..."
    if [ -f "nixpacks.toml.backup" ]; then
        cp nixpacks.toml.backup nixpacks.toml
        echo "✅ Created nixpacks.toml from backup"
    else
        echo "❌ No nixpacks configuration found. Please create nixpacks.toml"
        exit 1
    fi
fi

echo "✅ Found required files"

# Run type checking
echo "🔍 Running type check..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "❌ Type check failed. Please fix type errors before deploying."
    exit 1
fi

echo "✅ Type check passed"

# Run tests if they exist
if npm list vitest > /dev/null 2>&1; then
    echo "🧪 Running tests..."
    npm test
    if [ $? -ne 0 ]; then
        echo "❌ Tests failed. Please fix failing tests before deploying."
        exit 1
    fi
    echo "✅ Tests passed"
fi

# Build the application locally to verify
echo "🔨 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

echo "✅ Build successful"

# Clean up build artifacts (they will be rebuilt during deployment)
rm -rf dist

echo "🎉 Deployment preparation complete!"
echo ""
echo "Your project is ready for Nixpacks deployment."
echo ""
echo "Environment variables needed for production:"
echo "  - DATABASE_URL or individual MYSQL_* variables"
echo "  - PORT (optional, defaults to 3000)"
echo "  - NODE_ENV=production"
echo ""
echo "Deploy with your preferred platform that supports Nixpacks:"
echo "  - Railway: railway up"
echo "  - Render: git push"
echo "  - Fly.io: fly deploy"
echo "  - EasyPanel: git push to connected repository"
echo "  - Any Nixpacks-compatible platform"
