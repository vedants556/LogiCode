# Ultra-minimal Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Copy only what we need
COPY backend/package*.json ./
COPY backend/ ./

# Install dependencies
RUN npm ci --only=production --no-audit --no-fund

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
