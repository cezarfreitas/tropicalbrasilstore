# Simple Dockerfile for EasyPanel with external database
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Create upload directories
RUN mkdir -p public/uploads/logos && \
    mkdir -p public/uploads/products && \
    mkdir -p server/public/uploads/logos && \
    mkdir -p server/public/uploads/products

# Set environment for external database
ENV NODE_ENV=development
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check for EasyPanel
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use development server
CMD ["npm", "run", "dev"]
