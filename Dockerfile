# Production Dockerfile for EasyPanel
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
    mkdir -p public/uploads/products

# Set environment
ENV NODE_ENV=production
ENV PORT=80

# Build the application
RUN npm run build

# Expose port 80 (EasyPanel requirement)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Start production server
CMD ["npm", "start"]
