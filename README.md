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

## Deploy

### Frontend → Vercel

1. Importa el repo en [vercel.com/new](https://vercel.com/new)
2. Vercel detecta automáticamente `apps/web` como root directory (configurado en `vercel.json`)
3. Agrega estas variables de entorno en el dashboard de Vercel:

```
NEXT_PUBLIC_API_URL=https://your-api.railway.app
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=https://your-app.vercel.app
```

### API → Railway

1. Crea un nuevo proyecto en [railway.app](https://railway.app)
2. Conecta este repo — Railway usa `railway.json` + `apps/api/Dockerfile`
3. Agrega los servicios **PostgreSQL** y **Redis** desde el catálogo de Railway
4. Configura las variables de entorno:

```
DATABASE_URL=<railway-postgres-url>
REDIS_URL=<railway-redis-url>
JWT_SECRET=<random-32-char-string>
SENDGRID_API_KEY=<tu-key>
TWILIO_ACCOUNT_SID=<tu-sid>
TWILIO_AUTH_TOKEN=<tu-token>
ALLOWED_ORIGINS=https://your-app.vercel.app
```

5. Ejecuta las migraciones:
```bash
railway run npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

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
