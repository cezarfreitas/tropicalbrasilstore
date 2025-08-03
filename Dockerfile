# =============================================================================
# Chinelos Store - Production Dockerfile
# Optimized for performance and security
# =============================================================================

# Use Node.js 22 LTS Alpine for smaller image size
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Install security updates and required tools
RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# =============================================================================
# Dependencies stage
# =============================================================================
FROM base AS deps

# Copy package files
COPY package*.json ./

# Install dependencies with clean cache
RUN npm ci --only=production --silent && \
    npm cache clean --force

# =============================================================================
# Build stage
# =============================================================================
FROM base AS builder

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci --silent

# Copy source code
COPY . .

# Build the application
ENV NODE_ENV=production
RUN npm run build

# =============================================================================
# Runtime stage
# =============================================================================
FROM base AS runner

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Create upload directories with proper permissions
RUN mkdir -p public/uploads/logos public/uploads/products && \
    mkdir -p server/public/uploads/logos server/public/uploads/products && \
    chown -R nextjs:nodejs public server/public

# Copy public assets if they exist
COPY --chown=nextjs:nodejs public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
