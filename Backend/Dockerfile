FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDeps for TypeScript compilation)
RUN npm ci

# Copy source
COPY src ./src

# Compile TypeScript
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Production image — only runtime deps, no source or devDeps
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only the compiled output and production deps
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Drop all privileges
USER appuser

# Expose the application port
EXPOSE 5000

# Health check — used by Docker/k8s orchestrators
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "dist/server.js"]
