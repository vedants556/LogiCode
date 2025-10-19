# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install dependencies for building
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies (including dev dependencies for building)
RUN npm ci --no-audit --no-fund && \
    npm --prefix backend ci --no-audit --no-fund && \
    npm --prefix frontend ci --no-audit --no-fund

# Copy source code
COPY . .

# Build frontend
RUN npm --prefix frontend run build

# Production stage - minimal image
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install only production dependencies
RUN npm ci --only=production --no-audit --no-fund && \
    npm --prefix backend ci --only=production --no-audit --no-fund

# Copy backend source and built frontend
COPY backend/ ./backend/
COPY --from=base /app/backend/public ./backend/public

# Set working directory to backend
WORKDIR /app/backend

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
