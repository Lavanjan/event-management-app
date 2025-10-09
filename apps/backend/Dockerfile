# Multi-stage build for NestJS Backend
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./
COPY apps/backend/package*.json ./apps/backend/
COPY libs/shared-types/package*.json ./libs/shared-types/
COPY libs/shared-utils/package*.json ./libs/shared-utils/

# Install dependencies
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the backend application
WORKDIR /app/apps/backend
RUN npm run build

# Production image, copy all the files and run nest
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy the built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./package.json

# Create uploads and logs directories
RUN mkdir -p uploads/documents uploads/temp uploads/thumbnails logs
RUN chown -R nestjs:nodejs uploads logs

USER nestjs

EXPOSE 6000

ENV PORT 6000

CMD ["node", "main.js"]
