# Use Node.js 22 LTS
FROM node:22-alpine

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

# Start the application
CMD ["npm", "start"]
