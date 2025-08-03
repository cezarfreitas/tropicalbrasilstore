# Simple Dockerfile using development server
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

# Set environment
ENV NODE_ENV=development
ENV PORT=3000

# Expose port
EXPOSE 3000

# Use development server (same as Fly.dev)
CMD ["npm", "run", "dev"]
