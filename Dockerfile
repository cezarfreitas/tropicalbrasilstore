# Use Node.js 22 LTS Alpine
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install required system dependencies
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Remove package-lock.json and install dependencies
RUN rm -f package-lock.json && \
    npm install --legacy-peer-deps && \
    npm cache clean --force

# Copy source code
COPY . .

# Create upload directories
RUN mkdir -p public/uploads/logos public/uploads/products && \
    mkdir -p server/public/uploads/logos server/public/uploads/products

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
