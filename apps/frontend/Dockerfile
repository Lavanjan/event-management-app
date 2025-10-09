# ---------- Stage 1: Builder ----------
FROM node:20-alpine AS builder

WORKDIR /app


# Copy package files
COPY ../../package*.json ../
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build arguments (for Vite)
ARG VITE_API_BASE_URL
ARG VITE_API_URL
ARG VITE_API_PROXY_TARGET
ARG VITE_API_TIMEOUT
ARG VITE_PORT
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_APP_ENVIRONMENT
ARG VITE_ENABLE_CSRF
ARG VITE_ENABLE_REQUEST_LOGGING
ARG VITE_ENABLE_PAYMENT_MODULE
ARG VITE_ENABLE_ROLE_MANAGEMENT
ARG VITE_ENABLE_ADVANCED_PERMISSIONS
ARG VITE_ENABLE_MOCK_DATA
ARG VITE_ENABLE_DEBUG_MODE
ARG BACKEND_URL

# Export them as environment variables for build-time use
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_API_PROXY_TARGET=${VITE_API_PROXY_TARGET}
ENV VITE_API_TIMEOUT=${VITE_API_TIMEOUT}
ENV VITE_PORT=${VITE_PORT}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
ENV VITE_APP_ENVIRONMENT=${VITE_APP_ENVIRONMENT}
ENV VITE_ENABLE_CSRF=${VITE_ENABLE_CSRF}
ENV VITE_ENABLE_REQUEST_LOGGING=${VITE_ENABLE_REQUEST_LOGGING}
ENV VITE_ENABLE_PAYMENT_MODULE=${VITE_ENABLE_PAYMENT_MODULE}
ENV VITE_ENABLE_ROLE_MANAGEMENT=${VITE_ENABLE_ROLE_MANAGEMENT}
ENV VITE_ENABLE_ADVANCED_PERMISSIONS=${VITE_ENABLE_ADVANCED_PERMISSIONS}
ENV VITE_ENABLE_MOCK_DATA=${VITE_ENABLE_MOCK_DATA}
ENV VITE_ENABLE_DEBUG_MODE=${VITE_ENABLE_DEBUG_MODE}
ENV BACKEND_URL=${BACKEND_URL}

# Verify env vars are set (helpful for debugging)
RUN echo "🔍 Build-time environment check:" && \
    echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" && \
    echo "VITE_API_PROXY_TARGET=$VITE_API_PROXY_TARGET" && \
    echo "VITE_APP_VERSION=$VITE_APP_VERSION"

# Build the Vite app (this bakes envs into the bundle)
RUN npm run build

# Verify the build output
RUN echo "✅ Build completed. Checking dist folder:" && \
    ls -la /app/dist && \
    echo "📦 Assets:" && \
    ls -la /app/dist/assets/

# ---------- Stage 2: Production ----------
FROM node:20-alpine AS runner

WORKDIR /app

# Install a simple static server
RUN npm install -g serve

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 4201

CMD ["serve", "-s", "dist", "-l", "4201"]