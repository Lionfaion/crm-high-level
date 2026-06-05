FROM node:20-alpine AS base
WORKDIR /app

# ── Install deps ───────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
RUN npm ci --ignore-scripts

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma
RUN npm run build --workspace=@crm/db
RUN npm run build --workspace=@crm/api || true
RUN test -f apps/api/dist/index.js || (echo "ERROR: dist/index.js not generated" && exit 1)

# ── Runtime image ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
