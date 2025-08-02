# Use Node.js 18 Alpine for smaller image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for building (needed for Sharp and other native deps)
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Clean npm cache and install dependencies with timeout
RUN npm cache clean --force && \
    rm -f package-lock.json && \
    npm install --legacy-peer-deps --no-fund --no-audit --timeout=120000

# Copy source code
COPY . .

# Set build environment variables for optimization
ENV NODE_ENV=production
ENV VITE_BUILD_FAST=true
ENV DISABLE_ESLINT_PLUGIN=true

# Build with multiple fallback strategies
RUN npm run build:client-only || npm run build || npm run build:regular

# Clean up build dependencies to reduce image size
RUN npm prune --production && \
    npm cache clean --force && \
    apk del python3 make g++

# Ensure uploads directories exist
RUN mkdir -p public/uploads/logos public/uploads/products

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
