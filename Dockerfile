# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Delete package-lock.json if it exists and install dependencies with legacy peer deps
RUN rm -f package-lock.json && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application with verbose output
RUN npm run build --verbose

# Remove dev dependencies after build to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
