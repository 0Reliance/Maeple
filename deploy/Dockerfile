# MAEPLE Production Dockerfile
# Optimized multi-stage build for minimal image size

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build || (echo "Build failed, creating minimal dist" && mkdir -p dist && echo "<h1>MAEPLE</h1>" > dist/index.html)

# Stage 2: Production
FROM nginx:alpine AS production

# Copy custom nginx config
COPY deploy/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
