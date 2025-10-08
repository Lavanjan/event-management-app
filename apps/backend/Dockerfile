# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install only production dependencies
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install all dependencies (including dev)
RUN npm ci --no-audit --no-fund
# Copy source code
COPY . .
# Build the application
RUN npm run build && \
    npm cache clean --force

# Stage 3: Production runner
FROM node:22-alpine AS runner
WORKDIR /app
# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init
# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs
# Create uploads directory with proper ownership
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads    
# Copy production dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nodejs:nodejs /app/package*.json ./
# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs
# Set environment variables
ENV NODE_ENV=production
ENV PORT=3004
# Expose port
EXPOSE 3004
# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]