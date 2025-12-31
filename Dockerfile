# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (standalone output)
# Provide dummy DATABASE_URL for build - Prisma 7 requires it for client validation
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

# Preserve full node_modules for prisma CLI (has deep dependency tree)
# TODO: Optimize by using a separate migration container or moving prisma to dependencies
RUN cp -r node_modules /prisma-deps

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Required for Next.js standalone to bind to all interfaces (not just 127.0.0.1)
ENV HOSTNAME=0.0.0.0

# Copy built app (standalone output includes node_modules)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema and config (needed for migrations)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy Prisma CLI and its dependencies for migrations (merges with standalone)
COPY --from=builder /prisma-deps/ ./node_modules/

# Remove npm and prune dev-only packages to reduce image size
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx && \
    rm -rf node_modules/@types node_modules/typescript node_modules/eslint* \
           node_modules/@eslint* node_modules/@typescript* node_modules/tailwindcss \
           node_modules/@tailwindcss* node_modules/postcss node_modules/autoprefixer \
           node_modules/.cache node_modules/@next/swc* node_modules/tw-animate-css \
           node_modules/dotenv node_modules/lightningcss* 2>/dev/null || true

# Run as non-root user (CKS best practice)
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Create directories for volumes with proper ownership
RUN mkdir -p /app/uploads /app/public/images && chown -R nextjs:nodejs /app/uploads /app/public/images

USER nextjs

EXPOSE 3000

# Health check using the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]
