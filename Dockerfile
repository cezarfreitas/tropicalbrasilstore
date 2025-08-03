# Use Node.js 18 LTS
FROM node:18-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Delete package-lock.json if it exists and install dependencies with legacy peer deps
RUN rm -f package-lock.json && npm cache clean --force && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Ensure uploads directories exist
RUN mkdir -p public/uploads/logos public/uploads/products

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Add healthcheck for container monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start EasyPanel force server
CMD ["npm", "run", "start:easypanel"]
