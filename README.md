# CRM High Level

A full-featured CRM and marketing automation platform replicating GoHighLevel's capabilities.

## Modules

- **CRM** — Contacts, Pipelines, Opportunities (Kanban)
- **Messaging** — Email, SMS, Unified Inbox, Campaigns
- **Automation** — Visual Workflow Builder, Triggers, Webhooks
- **Calendar** — Booking Pages, Appointments, Google Sync
- **Funnels** — Drag-and-drop Page Builder, A/B Testing
- **Reputation** — Google/Facebook Reviews, Review Requests
- **Memberships** — Courses, Drip Content, Student Portal
- **Payments** — Stripe, Invoicing, Subscriptions
- **White-label** — Sub-accounts, Agency Dashboard, Custom Domains

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, TailwindCSS, shadcn/ui |
| Backend | Node.js, Fastify, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache/Queue | Redis + BullMQ |
| Auth | NextAuth.js + JWT |
| Email | SendGrid |
| SMS | Twilio |
| Payments | Stripe |
| Storage | AWS S3 |
| Real-time | Socket.io |

## Getting Started

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

## Implementation Plan

See [docs/superpowers/plans/2026-06-04-crm-highlevel-master-plan.md](docs/superpowers/plans/2026-06-04-crm-highlevel-master-plan.md) for the full 120-day implementation plan.

## Progress

- [ ] Phase 1: Foundation (Days 1–10)
- [ ] Phase 2: CRM Core (Days 11–20)
- [ ] Phase 3: Messaging Hub (Days 21–30)
- [ ] Phase 4: Automation Workflows (Days 31–40)
- [ ] Phase 5: Calendar & Booking (Days 41–50)
- [ ] Phase 6: Funnels & Landing Pages (Days 51–65)
- [ ] Phase 7: Reputation Management (Days 66–70)
- [ ] Phase 8: Memberships & Courses (Days 71–80)
- [ ] Phase 9: Reporting & Analytics (Days 81–90)
- [ ] Phase 10: Billing & Payments (Days 91–100)
- [ ] Phase 11: White-label & Sub-accounts (Days 101–110)
- [ ] Phase 12: Polish & Production (Days 111–120)
