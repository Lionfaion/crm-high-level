FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ── Install deps ───────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
RUN npm ci --ignore-scripts

# ── Generate Prisma client ─────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npm run build --workspace=@crm/db 2>/dev/null || true
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma
RUN npm run build --workspace=@crm/api || true
RUN test -f apps/api/dist/index.js || (echo "ERROR: dist/index.js not generated" && exit 1)

# ── Runtime image ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's needed
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/db/src/generated ./packages/db/src/generated
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
