FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g turbo

# Prune monorepo to only what api needs
FROM base AS pruner
COPY . .
RUN turbo prune @crm/api --docker

# Install deps
FROM base AS installer
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci

# Build
COPY --from=pruner /app/out/full/ .
RUN npx turbo run build --filter=@crm/api

# Run prisma generate
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/api/dist ./apps/api/dist
COPY --from=installer /app/packages/db/src/generated ./packages/db/src/generated
COPY --from=installer /app/packages/db/prisma ./packages/db/prisma
COPY --from=installer /app/package.json ./package.json

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
