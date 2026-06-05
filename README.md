# CRM High Level

A full-featured CRM and marketing automation platform replicating GoHighLevel's capabilities.

## Modules

- **CRM** — Contacts, Pipelines, Opportunities (Kanban)
- **Messaging** — Email, SMS, Unified Inbox, Campaigns, Chatbot
- **Automation** — Visual Workflow Builder, Triggers, 10 Action Types
- **Calendar** — Booking Pages, Appointments, Availability Slots
- **Forms & Funnels** — Form Builder, Submission Tracking, Funnel Pages
- **Reputation** — Google/Facebook Reviews, Review Requests, Responses
- **Payments** — Invoicing, Products, Revenue Tracking
- **Memberships** — Courses, Drip Content, Enrollments
- **Reporting** — Dashboard KPIs, Growth Charts, CSV Export

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, TailwindCSS, shadcn/ui |
| Backend | Node.js, Fastify, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js + JWT |
| Email | SendGrid |
| SMS | Twilio |
| Real-time | Socket.io |

---

## Deploy en producción (100% gratuito)

| Servicio | Plataforma | Plan |
|----------|------------|------|
| Frontend (Next.js) | **Vercel** | Free |
| API (Fastify) | **Render.com** | Free |
| PostgreSQL | **Neon.tech** | Free forever |
| Redis | **Upstash** | Free forever |

---

### Paso 1 — Base de datos: Neon.tech

1. Crea cuenta en [neon.tech](https://neon.tech)
2. Crea un nuevo proyecto → copia la **Connection String** (formato `postgresql://...`)
3. Guárdala como `DATABASE_URL`

### Paso 2 — Redis: Upstash

1. Crea cuenta en [upstash.com](https://upstash.com)
2. Crea una base de datos Redis → copia la **Redis URL** (formato `rediss://...`)
3. Guárdala como `REDIS_URL`

### Paso 3 — API: Render.com

1. Crea cuenta en [render.com](https://render.com)
2. New → **Web Service** → Connect GitHub → selecciona este repo
3. Configuración:
   - **Root Directory**: `.` (raíz del repo)
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Environment**: Docker
4. En **Environment Variables** agrega:
   ```
   DATABASE_URL=<tu-url-de-neon>
   REDIS_URL=<tu-url-de-upstash>
   JWT_SECRET=<string-aleatorio-32-chars>
   ALLOWED_ORIGINS=https://tu-app.vercel.app
   NODE_ENV=production
   ```
5. Haz click en **Deploy** → copia la URL pública (ej: `https://crm-api.onrender.com`)
6. Ejecuta las migraciones desde el shell de Render:
   ```bash
   npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
   ```

### Paso 4 — Frontend: Vercel

1. Ve a [vercel.com/new](https://vercel.com/new) → importa este repo
2. Vercel detecta `vercel.json` automáticamente (root dir: `apps/web`)
3. En **Environment Variables** agrega:
   ```
   NEXT_PUBLIC_API_URL=https://crm-api.onrender.com
   NEXTAUTH_SECRET=<string-aleatorio-32-chars>
   NEXTAUTH_URL=https://tu-app.vercel.app
   ```
4. Deploy → ¡listo!

---

## Local Development

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Start database and Redis
docker-compose up -d

# 3. Install dependencies
npm install

# 4. Run database migrations
cd packages/db && npx prisma migrate dev

# 5. Start development servers
npm run dev
```

## Progress

- [x] Phase 1: Foundation (Days 1–10)
- [x] Phase 2: CRM Core (Days 11–20)
- [x] Phase 3: Messaging Hub (Days 21–30)
- [x] Phase 4: Automation Workflows (Days 31–40)
- [x] Phase 5: Calendar & Appointments (Days 41–50)
- [x] Phase 6: Forms & Funnels (Days 51–60)
- [x] Phase 7: Reputation Management (Days 61–70)
- [x] Phase 8: Payments & Invoicing (Days 71–80)
- [x] Phase 9: Memberships & Courses (Days 81–90)
- [x] Phase 10: Reporting & Analytics (Days 91–100)
