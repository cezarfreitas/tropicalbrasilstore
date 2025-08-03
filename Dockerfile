# Simple Dockerfile for EasyPanel
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files first
COPY package.json ./

# Install dependencies with npm install (more compatible than npm ci)
RUN npm install --production=false --legacy-peer-deps --silent

# Copy all source files
COPY . .

# Create necessary directories
RUN mkdir -p public/uploads/logos && \
    mkdir -p public/uploads/products && \
    mkdir -p server/public/uploads/logos && \
    mkdir -p server/public/uploads/products

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
