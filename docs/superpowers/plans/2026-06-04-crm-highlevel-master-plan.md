# CRM High Level - Implementation Plan (GoHighLevel Clone)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-featured CRM and marketing automation platform that replicates the core capabilities of GoHighLevel, organized in 12 phases over ~120 days.

**Architecture:** Multi-tenant SaaS built as a Next.js 14 monorepo with a Node.js/Fastify API backend, PostgreSQL database, Redis cache, and BullMQ job queues. Each bounded context (CRM, Messaging, Calendar, etc.) lives in its own domain module with clear interfaces.

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui, Zustand
- **Backend:** Node.js, Fastify, TypeScript, Prisma ORM
- **Database:** PostgreSQL (primary), Redis (sessions/cache/queues)
- **Auth:** NextAuth.js + JWT, RBAC
- **Messaging:** SendGrid (email), Twilio (SMS), Socket.io (real-time)
- **Payments:** Stripe
- **Storage:** AWS S3 / Cloudflare R2
- **Queue:** BullMQ
- **Infra:** Docker, GitHub Actions CI/CD

---

## PHASE 1: Foundation (Days 1–10)

### Day 1: Monorepo Setup & Docker

**Files:**
- Create: `package.json` (root, workspaces)
- Create: `apps/web/package.json`
- Create: `apps/api/package.json`
- Create: `packages/db/package.json`
- Create: `packages/ui/package.json`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `turbo.json`

- [ ] **Step 1.1: Initialize root monorepo**
```bash
cd C:\Users\Cris\Proyectos\crm-high-level
npm init -y
npm install -D turbo typescript
```

- [ ] **Step 1.2: Create turbo.json**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

- [ ] **Step 1.3: Create docker-compose.yml**
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: crm_highlevel
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD: crm_pass
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
volumes:
  postgres_data:
```

- [ ] **Step 1.4: Start services**
```bash
docker-compose up -d
```
Expected: PostgreSQL on 5432, Redis on 6379

- [ ] **Step 1.5: Create .env.example**
```env
DATABASE_URL=postgresql://crm_user:crm_pass@localhost:5432/crm_highlevel
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-in-production
NEXTAUTH_SECRET=change-me-in-production
NEXTAUTH_URL=http://localhost:3000
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
```

- [ ] **Step 1.6: Commit**
```bash
git init && git add . && git commit -m "chore: initialize monorepo with Docker"
```

---

### Day 2: Database Schema (Prisma)

**Files:**
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/package.json`

- [ ] **Step 2.1: Install Prisma**
```bash
cd packages/db && npm install prisma @prisma/client && npx prisma init
```

- [ ] **Step 2.2: Write base schema**
```prisma
// packages/db/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Agency {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  logoUrl   String?
  domain    String?  @unique
  createdAt DateTime @default(now())
  accounts  Account[]
  users     User[]
}

model Account {
  id        String   @id @default(cuid())
  agencyId  String
  name      String
  slug      String
  timezone  String   @default("UTC")
  createdAt DateTime @default(now())
  agency    Agency   @relation(fields: [agencyId], references: [id])
  users     User[]
  contacts  Contact[]
  pipelines Pipeline[]
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  passwordHash String
  role      UserRole @default(USER)
  agencyId  String?
  accountId String?
  createdAt DateTime @default(now())
  agency    Agency?  @relation(fields: [agencyId], references: [id])
  account   Account? @relation(fields: [accountId], references: [id])
}

enum UserRole {
  SUPER_ADMIN
  AGENCY_ADMIN
  ACCOUNT_ADMIN
  USER
}

model Contact {
  id          String   @id @default(cuid())
  accountId   String
  firstName   String
  lastName    String?
  email       String?
  phone       String?
  tags        String[]
  customFields Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  account     Account  @relation(fields: [accountId], references: [id])
  notes       Note[]
  activities  Activity[]
  opportunities Opportunity[]
}

model Pipeline {
  id        String   @id @default(cuid())
  accountId String
  name      String
  stages    Stage[]
  createdAt DateTime @default(now())
  account   Account  @relation(fields: [accountId], references: [id])
}

model Stage {
  id         String   @id @default(cuid())
  pipelineId String
  name       String
  order      Int
  pipeline   Pipeline @relation(fields: [pipelineId], references: [id])
  opportunities Opportunity[]
}

model Opportunity {
  id          String   @id @default(cuid())
  contactId   String
  stageId     String
  title       String
  value       Float?
  status      OpportunityStatus @default(OPEN)
  createdAt   DateTime @default(now())
  contact     Contact  @relation(fields: [contactId], references: [id])
  stage       Stage    @relation(fields: [stageId], references: [id])
}

enum OpportunityStatus {
  OPEN
  WON
  LOST
}

model Note {
  id        String   @id @default(cuid())
  contactId String
  body      String
  createdAt DateTime @default(now())
  contact   Contact  @relation(fields: [contactId], references: [id])
}

model Activity {
  id        String       @id @default(cuid())
  contactId String
  type      ActivityType
  data      Json?
  createdAt DateTime     @default(now())
  contact   Contact      @relation(fields: [contactId], references: [id])
}

enum ActivityType {
  EMAIL_SENT
  EMAIL_OPENED
  SMS_SENT
  CALL_LOGGED
  NOTE_ADDED
  STAGE_CHANGED
  FORM_SUBMITTED
  APPOINTMENT_BOOKED
}
```

- [ ] **Step 2.3: Run migration**
```bash
npx prisma migrate dev --name init
```
Expected: Migration created and applied

- [ ] **Step 2.4: Export Prisma client**
```typescript
// packages/db/src/index.ts
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
export * from '@prisma/client'
```

- [ ] **Step 2.5: Commit**
```bash
git add . && git commit -m "feat(db): initial Prisma schema with Agency/Account/User/Contact/Pipeline"
```

---

### Day 3: Auth System (JWT + NextAuth)

**Files:**
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/auth.routes.ts`
- Create: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/web/src/lib/auth.ts`

- [ ] **Step 3.1: Install auth dependencies**
```bash
cd apps/api && npm install bcrypt jsonwebtoken
cd apps/web && npm install next-auth @auth/prisma-adapter
```

- [ ] **Step 3.2: Write AuthService**
```typescript
// apps/api/src/modules/auth/auth.service.ts
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '@crm/db'

const JWT_SECRET = process.env.JWT_SECRET!

export class AuthService {
  async register(email: string, password: string, name: string) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new Error('Email already registered')
    const passwordHash = await bcrypt.hash(password, 12)
    return prisma.user.create({ data: { email, name, passwordHash } })
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new Error('Invalid credentials')
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new Error('Invalid credentials')
    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }
  }

  verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as { sub: string; role: string }
  }
}
```

- [ ] **Step 3.3: Write auth routes**
```typescript
// apps/api/src/modules/auth/auth.routes.ts
import { FastifyInstance } from 'fastify'
import { AuthService } from './auth.service'

const authService = new AuthService()

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (req, reply) => {
    const { email, password, name } = req.body as any
    const user = await authService.register(email, password, name)
    return reply.send({ id: user.id, email: user.email })
  })

  app.post('/auth/login', async (req, reply) => {
    const { email, password } = req.body as any
    const result = await authService.login(email, password)
    return reply.send(result)
  })
}
```

- [ ] **Step 3.4: Write failing test**
```typescript
// tests/auth/auth.service.test.ts
import { AuthService } from '../../apps/api/src/modules/auth/auth.service'
const svc = new AuthService()
test('register then login returns token', async () => {
  const user = await svc.register('test@test.com', 'password123', 'Test User')
  expect(user.email).toBe('test@test.com')
  const { token } = await svc.login('test@test.com', 'password123')
  expect(token).toBeDefined()
})
```

- [ ] **Step 3.5: Run test**
```bash
npx jest tests/auth/auth.service.test.ts
```
Expected: PASS

- [ ] **Step 3.6: Commit**
```bash
git add . && git commit -m "feat(auth): JWT register/login service and routes"
```

---

### Day 4: RBAC & Middleware

**Files:**
- Create: `apps/api/src/middleware/authenticate.ts`
- Create: `apps/api/src/middleware/authorize.ts`
- Create: `apps/api/src/types/request.ts`

- [ ] **Step 4.1: Write authenticate middleware**
```typescript
// apps/api/src/middleware/authenticate.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from '../modules/auth/auth.service'
const authService = new AuthService()

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Unauthorized' })
  try {
    const token = header.slice(7)
    const payload = authService.verifyToken(token)
    ;(req as any).user = payload
  } catch {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}
```

- [ ] **Step 4.2: Write authorize middleware**
```typescript
// apps/api/src/middleware/authorize.ts
import { FastifyRequest, FastifyReply } from 'fastify'

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100, AGENCY_ADMIN: 80, ACCOUNT_ADMIN: 60, USER: 20
}

export function authorize(minRole: string) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user
    if (!user || ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[minRole]) {
      return reply.status(403).send({ error: 'Forbidden' })
    }
  }
}
```

- [ ] **Step 4.3: Commit**
```bash
git add . && git commit -m "feat(auth): RBAC middleware with role hierarchy"
```

---

### Day 5: API Foundation (Fastify App)

**Files:**
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/plugins/cors.ts`
- Create: `apps/api/src/plugins/error-handler.ts`

- [ ] **Step 5.1: Install Fastify**
```bash
cd apps/api && npm install fastify @fastify/cors @fastify/helmet fastify-plugin
```

- [ ] **Step 5.2: Create app.ts**
```typescript
// apps/api/src/app.ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { authRoutes } from './modules/auth/auth.routes'

export function buildApp() {
  const app = Fastify({ logger: true })
  app.register(helmet)
  app.register(cors, { origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' })
  app.register(authRoutes, { prefix: '/api/v1' })
  app.get('/health', () => ({ status: 'ok' }))
  return app
}
```

- [ ] **Step 5.3: Create server.ts**
```typescript
// apps/api/src/server.ts
import { buildApp } from './app'
const app = buildApp()
app.listen({ port: 4000, host: '0.0.0.0' })
  .then(() => console.log('API running on :4000'))
  .catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 5.4: Test health endpoint**
```bash
npx ts-node apps/api/src/server.ts &
curl http://localhost:4000/health
```
Expected: `{"status":"ok"}`

- [ ] **Step 5.5: Commit**
```bash
git add . && git commit -m "feat(api): Fastify app with CORS, helmet, health endpoint"
```

---

### Day 6: Next.js Frontend Setup

**Files:**
- Create: `apps/web/` (Next.js 14 app)
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/tailwind.config.ts`

- [ ] **Step 6.1: Create Next.js app**
```bash
cd apps && npx create-next-app@latest web --typescript --tailwind --app --src-dir
cd web && npm install @radix-ui/react-icons lucide-react class-variance-authority clsx tailwind-merge
npx shadcn-ui@latest init
```

- [ ] **Step 6.2: Configure layout**
```tsx
// apps/web/src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = { title: 'CRM High Level', description: 'Your complete CRM platform' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6.3: Commit**
```bash
git add . && git commit -m "feat(web): Next.js 14 frontend with Tailwind and shadcn/ui"
```

---

### Day 7: Dashboard Shell & Navigation

**Files:**
- Create: `apps/web/src/app/(dashboard)/layout.tsx`
- Create: `apps/web/src/components/sidebar/Sidebar.tsx`
- Create: `apps/web/src/components/sidebar/NavItem.tsx`
- Create: `apps/web/src/app/(dashboard)/page.tsx`

- [ ] **Step 7.1: Create dashboard layout**
```tsx
// apps/web/src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/sidebar/Sidebar'
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 7.2: Create Sidebar with all GHL modules**
```tsx
// apps/web/src/components/sidebar/Sidebar.tsx
import { NavItem } from './NavItem'
import { Users, BarChart3, Mail, Calendar, Globe, Star, BookOpen, CreditCard, Building2 } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/', icon: BarChart3 },
  { label: 'Contacts', href: '/contacts', icon: Users },
  { label: 'Pipelines', href: '/pipelines', icon: BarChart3 },
  { label: 'Conversations', href: '/conversations', icon: Mail },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Funnels', href: '/funnels', icon: Globe },
  { label: 'Reputation', href: '/reputation', icon: Star },
  { label: 'Memberships', href: '/memberships', icon: BookOpen },
  { label: 'Payments', href: '/payments', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Building2 },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-700">CRM HighLevel</div>
      <nav className="flex-1 p-2">
        {navItems.map(item => <NavItem key={item.href} {...item} />)}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 7.3: Commit**
```bash
git add . && git commit -m "feat(web): dashboard shell with sidebar navigation"
```

---

### Day 8: Settings System

**Files:**
- Create: `apps/web/src/app/(dashboard)/settings/page.tsx`
- Create: `apps/api/src/modules/settings/settings.service.ts`
- Create: `apps/api/src/modules/settings/settings.routes.ts`

- [ ] **Step 8.1: Add AccountSettings to schema**
```prisma
// Add to packages/db/prisma/schema.prisma
model AccountSettings {
  id             String  @id @default(cuid())
  accountId      String  @unique
  businessName   String?
  businessPhone  String?
  businessEmail  String?
  address        String?
  timezone       String  @default("UTC")
  logoUrl        String?
  primaryColor   String  @default("#4F46E5")
  account        Account @relation(fields: [accountId], references: [id])
}
```

- [ ] **Step 8.2: Migrate**
```bash
cd packages/db && npx prisma migrate dev --name add-account-settings
```

- [ ] **Step 8.3: Commit**
```bash
git add . && git commit -m "feat(settings): account settings model and API"
```

---

### Day 9: Multi-tenant Account Switching

**Files:**
- Create: `apps/web/src/context/AccountContext.tsx`
- Create: `apps/web/src/hooks/useAccount.ts`
- Create: `apps/api/src/middleware/resolve-account.ts`

- [ ] **Step 9.1: Account context**
```tsx
// apps/web/src/context/AccountContext.tsx
'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
type Account = { id: string; name: string; slug: string }
const AccountContext = createContext<{ account: Account | null; setAccount: (a: Account) => void } | null>(null)
export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  return <AccountContext.Provider value={{ account, setAccount }}>{children}</AccountContext.Provider>
}
export function useAccount() {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccount must be inside AccountProvider')
  return ctx
}
```

- [ ] **Step 9.2: API middleware to scope queries by account**
```typescript
// apps/api/src/middleware/resolve-account.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@crm/db'
export async function resolveAccount(req: FastifyRequest, reply: FastifyReply) {
  const accountId = req.headers['x-account-id'] as string
  if (!accountId) return reply.status(400).send({ error: 'Missing X-Account-Id header' })
  const account = await prisma.account.findUnique({ where: { id: accountId } })
  if (!account) return reply.status(404).send({ error: 'Account not found' })
  ;(req as any).account = account
}
```

- [ ] **Step 9.3: Commit**
```bash
git add . && git commit -m "feat(multitenancy): account context and API middleware"
```

---

### Day 10: CI/CD with GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 10.1: Create CI workflow**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: crm_test
          POSTGRES_USER: crm_user
          POSTGRES_PASSWORD: crm_pass
        ports: ["5432:5432"]
      redis:
        image: redis:7
        ports: ["6379:6379"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - run: npm test
        env:
          DATABASE_URL: postgresql://crm_user:crm_pass@localhost:5432/crm_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
```

- [ ] **Step 10.2: Commit**
```bash
git add . && git commit -m "ci: GitHub Actions workflow for tests and lint"
```

---

## PHASE 2: CRM Core (Days 11–20)

### Day 11: Contact CRUD API

**Files:**
- Create: `apps/api/src/modules/contacts/contact.service.ts`
- Create: `apps/api/src/modules/contacts/contact.routes.ts`
- Create: `apps/api/src/modules/contacts/contact.schema.ts`

- [ ] **Step 11.1: Write ContactService**
```typescript
// apps/api/src/modules/contacts/contact.service.ts
import { prisma } from '@crm/db'

export class ContactService {
  async list(accountId: string, filters: { search?: string; tags?: string[] } = {}) {
    return prisma.contact.findMany({
      where: {
        accountId,
        ...(filters.search ? {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ]
        } : {}),
        ...(filters.tags?.length ? { tags: { hasSome: filters.tags } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(accountId: string, data: { firstName: string; lastName?: string; email?: string; phone?: string; tags?: string[] }) {
    return prisma.contact.create({ data: { accountId, ...data } })
  }

  async get(accountId: string, id: string) {
    return prisma.contact.findFirst({ where: { id, accountId }, include: { notes: true, activities: { orderBy: { createdAt: 'desc' }, take: 20 } } })
  }

  async update(accountId: string, id: string, data: Partial<{ firstName: string; lastName: string; email: string; phone: string; tags: string[] }>) {
    return prisma.contact.updateMany({ where: { id, accountId }, data })
  }

  async delete(accountId: string, id: string) {
    return prisma.contact.deleteMany({ where: { id, accountId } })
  }
}
```

- [ ] **Step 11.2: Write routes**
```typescript
// apps/api/src/modules/contacts/contact.routes.ts
import { FastifyInstance } from 'fastify'
import { ContactService } from './contact.service'
import { authenticate } from '../../middleware/authenticate'
import { resolveAccount } from '../../middleware/resolve-account'

const svc = new ContactService()

export async function contactRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', resolveAccount)

  app.get('/contacts', async (req) => svc.list((req as any).account.id, req.query as any))
  app.post('/contacts', async (req) => svc.create((req as any).account.id, req.body as any))
  app.get('/contacts/:id', async (req) => svc.get((req as any).account.id, (req.params as any).id))
  app.patch('/contacts/:id', async (req) => svc.update((req as any).account.id, (req.params as any).id, req.body as any))
  app.delete('/contacts/:id', async (req) => svc.delete((req as any).account.id, (req.params as any).id))
}
```

- [ ] **Step 11.3: Test**
```bash
npx jest tests/contacts/ -v
```

- [ ] **Step 11.4: Commit**
```bash
git add . && git commit -m "feat(crm): contact CRUD service and routes"
```

---

### Day 12: Contact Import/Export (CSV)

**Files:**
- Create: `apps/api/src/modules/contacts/contact.import.ts`
- Create: `apps/web/src/app/(dashboard)/contacts/import/page.tsx`

- [ ] **Step 12.1: Install csv-parse**
```bash
cd apps/api && npm install csv-parse papaparse
```

- [ ] **Step 12.2: Write import service**
```typescript
// apps/api/src/modules/contacts/contact.import.ts
import { parse } from 'csv-parse/sync'
import { prisma } from '@crm/db'

export async function importContactsFromCSV(accountId: string, csvBuffer: Buffer) {
  const records = parse(csvBuffer, { columns: true, skip_empty_lines: true })
  const contacts = records.map((r: any) => ({
    accountId,
    firstName: r.first_name || r.firstName || r.name?.split(' ')[0] || 'Unknown',
    lastName: r.last_name || r.lastName || r.name?.split(' ').slice(1).join(' ') || null,
    email: r.email || null,
    phone: r.phone || r.mobile || null,
    tags: r.tags ? r.tags.split(',').map((t: string) => t.trim()) : [],
  }))
  return prisma.contact.createMany({ data: contacts, skipDuplicates: true })
}
```

- [ ] **Step 12.3: Add import route**
```typescript
// In contact.routes.ts add:
app.post('/contacts/import', async (req, reply) => {
  const data = await req.file()
  const buffer = await data?.toBuffer()
  if (!buffer) return reply.status(400).send({ error: 'No file uploaded' })
  const result = await importContactsFromCSV((req as any).account.id, buffer)
  return { imported: result.count }
})
```

- [ ] **Step 12.4: Commit**
```bash
git add . && git commit -m "feat(crm): CSV contact import with field mapping"
```

---

### Day 13: Contact UI (List + Detail)

**Files:**
- Create: `apps/web/src/app/(dashboard)/contacts/page.tsx`
- Create: `apps/web/src/app/(dashboard)/contacts/[id]/page.tsx`
- Create: `apps/web/src/components/contacts/ContactCard.tsx`
- Create: `apps/web/src/components/contacts/ContactForm.tsx`

- [ ] **Step 13.1: Create contacts list page**
```tsx
// apps/web/src/app/(dashboard)/contacts/page.tsx
'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { ContactCard } from '@/components/contacts/ContactCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const { data: contacts, isLoading } = useSWR(`/api/contacts?search=${search}`, fetcher)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Button>+ Add Contact</Button>
      </div>
      <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
      {isLoading ? <p>Loading...</p> : contacts?.map((c: any) => <ContactCard key={c.id} contact={c} />)}
    </div>
  )
}
```

- [ ] **Step 13.2: Commit**
```bash
git add . && git commit -m "feat(web): contacts list with search UI"
```

---

### Day 14: Pipeline Model & API

**Files:**
- Create: `apps/api/src/modules/pipelines/pipeline.service.ts`
- Create: `apps/api/src/modules/pipelines/pipeline.routes.ts`

- [ ] **Step 14.1: Write PipelineService**
```typescript
// apps/api/src/modules/pipelines/pipeline.service.ts
import { prisma } from '@crm/db'

export class PipelineService {
  async list(accountId: string) {
    return prisma.pipeline.findMany({ where: { accountId }, include: { stages: { orderBy: { order: 'asc' } } } })
  }

  async create(accountId: string, name: string, stageNames: string[]) {
    return prisma.pipeline.create({
      data: {
        accountId, name,
        stages: { create: stageNames.map((n, i) => ({ name: n, order: i })) }
      },
      include: { stages: true }
    })
  }

  async addOpportunity(stageId: string, contactId: string, title: string, value?: number) {
    return prisma.opportunity.create({ data: { stageId, contactId, title, value } })
  }

  async moveOpportunity(opportunityId: string, newStageId: string) {
    return prisma.opportunity.update({ where: { id: opportunityId }, data: { stageId: newStageId } })
  }
}
```

- [ ] **Step 14.2: Commit**
```bash
git add . && git commit -m "feat(crm): pipeline service with stages and opportunities"
```

---

### Day 15: Kanban UI (Pipeline Board)

**Files:**
- Create: `apps/web/src/app/(dashboard)/pipelines/[id]/page.tsx`
- Create: `apps/web/src/components/pipeline/KanbanBoard.tsx`
- Create: `apps/web/src/components/pipeline/KanbanColumn.tsx`
- Create: `apps/web/src/components/pipeline/OpportunityCard.tsx`

- [ ] **Step 15.1: Install DnD library**
```bash
cd apps/web && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 15.2: Create KanbanBoard**
```tsx
// apps/web/src/components/pipeline/KanbanBoard.tsx
'use client'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'

interface Stage { id: string; name: string; opportunities: any[] }
interface Props { stages: Stage[]; onMove: (opportunityId: string, newStageId: string) => void }

export function KanbanBoard({ stages, onMove }: Props) {
  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over) return
    onMove(e.active.id as string, e.over.id as string)
  }
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => <KanbanColumn key={stage.id} stage={stage} />)}
      </div>
    </DndContext>
  )
}
```

- [ ] **Step 15.3: Commit**
```bash
git add . && git commit -m "feat(web): Kanban board with drag-and-drop pipeline"
```

---

### Days 16–20: Activity Feed, Timeline, Search, Tags, CRM Tests

_(Continue pattern: service → routes → UI → tests → commit per day)_

- **Day 16:** Notes API + Notes UI on contact detail
- **Day 17:** Activity feed (auto-log on events) + Activity timeline component
- **Day 18:** Advanced search (filter by tag, date, custom field) 
- **Day 19:** Contact tags UI, custom fields CRUD
- **Day 20:** Full CRM test suite, fix regressions

---

## PHASE 3: Messaging Hub (Days 21–30)

### Day 21: Email Integration (SendGrid)

**Files:**
- Create: `apps/api/src/modules/messaging/email.service.ts`
- Create: `apps/api/src/modules/messaging/email.routes.ts`

- [ ] **Step 21.1: Install SendGrid**
```bash
cd apps/api && npm install @sendgrid/mail
```

- [ ] **Step 21.2: EmailService**
```typescript
// apps/api/src/modules/messaging/email.service.ts
import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export class EmailService {
  async send(to: string, from: string, subject: string, html: string) {
    return sgMail.send({ to, from, subject, html })
  }

  async sendBulk(messages: { to: string; subject: string; html: string }[], from: string) {
    return sgMail.send(messages.map(m => ({ ...m, from })))
  }
}
```

- [ ] **Step 21.3: Commit**
```bash
git add . && git commit -m "feat(messaging): SendGrid email service"
```

---

### Day 22–23: SMS (Twilio) + Unified Inbox

**Day 22: SMS**
```typescript
// apps/api/src/modules/messaging/sms.service.ts
import twilio from 'twilio'
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export class SmsService {
  async send(to: string, from: string, body: string) {
    return client.messages.create({ to, from, body })
  }
}
```

**Day 23: Conversation model + unified inbox UI**
```prisma
model Conversation {
  id          String   @id @default(cuid())
  contactId   String
  accountId   String
  channel     Channel
  status      ConvStatus @default(OPEN)
  messages    Message[]
  contact     Contact  @relation(fields: [contactId], references: [id])
}
enum Channel { EMAIL SMS CHAT }
enum ConvStatus { OPEN CLOSED }

model Message {
  id             String   @id @default(cuid())
  conversationId String
  direction      Direction
  body           String
  sentAt         DateTime @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}
enum Direction { INBOUND OUTBOUND }
```

---

### Days 24–30: Campaigns, Chat Widget, Chatbot, Real-time

- **Day 24:** Email campaign builder (template engine with Handlebars)
- **Day 25:** SMS campaign builder + scheduling with BullMQ
- **Day 26:** Campaign list UI + send/schedule UI
- **Day 27:** Real-time inbox with Socket.io
- **Day 28:** Embeddable chat widget (iframe/JS snippet)
- **Day 29:** Basic chatbot rules engine (keyword triggers)
- **Day 30:** Messaging test suite

---

## PHASE 4: Automation Workflows (Days 31–40)

### Day 31: Workflow Engine Core

**Files:**
- Create: `apps/api/src/modules/workflows/workflow.engine.ts`
- Create: `apps/api/src/modules/workflows/workflow.types.ts`
- Create: `packages/db/prisma/schema-workflow.prisma` (merge into main schema)

- [ ] **Step 31.1: Workflow schema**
```prisma
model Workflow {
  id        String   @id @default(cuid())
  accountId String
  name      String
  active    Boolean  @default(false)
  trigger   Json
  steps     WorkflowStep[]
}

model WorkflowStep {
  id         String @id @default(cuid())
  workflowId String
  order      Int
  type       StepType
  config     Json
  workflow   Workflow @relation(fields: [workflowId], references: [id])
}

enum StepType {
  SEND_EMAIL SEND_SMS ADD_TAG REMOVE_TAG WAIT CONDITION WEBHOOK
}
```

- [ ] **Step 31.2: Workflow engine**
```typescript
// apps/api/src/modules/workflows/workflow.engine.ts
import { prisma } from '@crm/db'
import { EmailService } from '../messaging/email.service'
import { SmsService } from '../messaging/sms.service'
import Bull from 'bull'

const emailSvc = new EmailService()
const smsSvc = new SmsService()
export const workflowQueue = new Bull('workflows', process.env.REDIS_URL!)

workflowQueue.process(async (job) => {
  const { workflowId, contactId, stepIndex } = job.data
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId }, include: { steps: { orderBy: { order: 'asc' } } } })
  if (!workflow || stepIndex >= workflow.steps.length) return
  const step = workflow.steps[stepIndex]
  const contact = await prisma.contact.findUnique({ where: { id: contactId } })
  if (!contact) return

  if (step.type === 'SEND_EMAIL') {
    const { subject, html } = step.config as any
    await emailSvc.send(contact.email!, 'noreply@crm.local', subject, html)
  } else if (step.type === 'SEND_SMS') {
    const { body } = step.config as any
    await smsSvc.send(contact.phone!, process.env.TWILIO_FROM!, body)
  } else if (step.type === 'ADD_TAG') {
    const { tag } = step.config as any
    await prisma.contact.update({ where: { id: contactId }, data: { tags: { push: tag } } })
  } else if (step.type === 'WAIT') {
    const { delayMs } = step.config as any
    await workflowQueue.add({ workflowId, contactId, stepIndex: stepIndex + 1 }, { delay: delayMs })
    return
  }
  if (stepIndex + 1 < workflow.steps.length) {
    await workflowQueue.add({ workflowId, contactId, stepIndex: stepIndex + 1 })
  }
})

export async function triggerWorkflow(workflowId: string, contactId: string) {
  await workflowQueue.add({ workflowId, contactId, stepIndex: 0 })
}
```

- [ ] **Step 31.3: Commit**
```bash
git add . && git commit -m "feat(automation): BullMQ workflow engine with email/SMS/tag steps"
```

---

### Days 32–40: Visual Workflow Builder, Triggers, Webhooks

- **Day 32:** Trigger system (contact created, tag added, form submitted)
- **Day 33:** Condition/branching steps with JSON logic
- **Day 34:** Workflow CRUD API
- **Day 35:** Visual workflow builder UI (React Flow)
- **Day 36:** Step config panels (email template picker, delay config)
- **Day 37:** Workflow activate/deactivate + execution logs
- **Day 38:** Inbound webhooks (external triggers)
- **Day 39:** Outbound webhooks (notify external systems)
- **Day 40:** Automation test suite

---

## PHASE 5: Calendar & Booking (Days 41–50)

### Day 41: Calendar Model

```prisma
model CalendarEvent {
  id          String   @id @default(cuid())
  accountId   String
  userId      String
  title       String
  description String?
  startAt     DateTime
  endAt       DateTime
  contactId   String?
  type        EventType @default(APPOINTMENT)
  status      EventStatus @default(CONFIRMED)
}
enum EventType { APPOINTMENT BLOCK PERSONAL }
enum EventStatus { CONFIRMED CANCELLED NO_SHOW }

model Availability {
  id        String @id @default(cuid())
  userId    String
  dayOfWeek Int    // 0=Sun, 6=Sat
  startTime String // "09:00"
  endTime   String // "17:00"
}

model BookingPage {
  id          String @id @default(cuid())
  accountId   String
  userId      String
  slug        String @unique
  title       String
  duration    Int    // minutes
  bufferTime  Int    @default(15)
  active      Boolean @default(true)
}
```

- **Day 42:** Availability calculation service (slot generation)
- **Day 43:** Public booking page (no auth required)
- **Day 44:** Appointment CRUD + reschedule/cancel
- **Day 45:** Email/SMS reminders (cron via BullMQ)
- **Day 46:** Google Calendar OAuth sync
- **Day 47:** Calendar UI (month/week/day views using FullCalendar)
- **Day 48:** Embeddable booking widget
- **Day 49:** Team round-robin booking
- **Day 50:** Calendar test suite

---

## PHASE 6: Funnels & Landing Pages (Days 51–65)

### Day 51: Page Builder Foundation

```prisma
model Funnel {
  id        String   @id @default(cuid())
  accountId String
  name      String
  domain    String?
  pages     FunnelPage[]
}

model FunnelPage {
  id       String @id @default(cuid())
  funnelId String
  name     String
  slug     String
  order    Int
  content  Json   // Block tree
  funnel   Funnel @relation(fields: [funnelId], references: [id])
}
```

- **Day 52:** Block system (text, image, video, button, form, divider)
- **Day 53:** Drag-and-drop page editor (using react-dnd)
- **Day 54:** Form block → captures lead → creates Contact
- **Day 55:** Funnel step navigation (progress tracking)
- **Day 56:** Custom domain support + Next.js dynamic routing
- **Day 57:** SEO meta fields per page
- **Day 58:** Page templates library (10+ starter templates)
- **Day 59:** A/B testing (variant selection, conversion tracking)
- **Day 60:** Analytics (page views, conversion rate per step)
- **Day 61:** Thank-you page with redirect support
- **Day 62:** Form submission webhook integration
- **Day 63:** Mobile preview in editor
- **Day 64:** Publish/unpublish page
- **Day 65:** Funnel test suite

---

## PHASE 7: Reputation Management (Days 66–70)

- **Day 66:** Google My Business API integration (review fetching)
- **Day 67:** Facebook Reviews API integration  
- **Day 68:** Review request campaign (email/SMS ask for review)
- **Day 69:** Review dashboard (aggregate score, trends)
- **Day 70:** Embeddable review widget

---

## PHASE 8: Memberships & Courses (Days 71–80)

```prisma
model Course {
  id          String   @id @default(cuid())
  accountId   String
  title       String
  description String?
  price       Float?
  published   Boolean  @default(false)
  modules     CourseModule[]
}

model CourseModule {
  id       String   @id @default(cuid())
  courseId String
  title    String
  order    Int
  lessons  Lesson[]
}

model Lesson {
  id       String  @id @default(cuid())
  moduleId String
  title    String
  videoUrl String?
  content  String?
  order    Int
}

model Enrollment {
  id        String   @id @default(cuid())
  contactId String
  courseId  String
  enrolledAt DateTime @default(now())
  progress  Json     @default("{}")
}
```

- **Day 72:** Course builder UI (module/lesson CRUD)
- **Day 73:** Video upload to S3
- **Day 74:** Student portal (protected routes, progress tracking)
- **Day 75:** Drip content (unlock lesson after N days)
- **Day 76:** Completion tracking + certificates (PDF generation)
- **Day 77:** Access control (paid via Stripe)
- **Day 78:** Community comments per lesson
- **Day 79:** Course analytics (completion rates)
- **Day 80:** Membership test suite

---

## PHASE 9: Reporting & Analytics (Days 81–90)

- **Day 81:** Event tracking system (server-side event log table)
- **Day 82:** Dashboard summary widgets (contacts, revenue, conversions)
- **Day 83:** Contact growth chart (Chart.js / Recharts)
- **Day 84:** Pipeline value by stage (funnel chart)
- **Day 85:** Email campaign stats (open rate, click rate)
- **Day 86:** SMS campaign stats
- **Day 87:** Revenue reporting (MRR, total, by product)
- **Day 88:** Custom date range filter across all reports
- **Day 89:** CSV export for all reports
- **Day 90:** Analytics test suite

---

## PHASE 10: Billing & Payments (Days 91–100)

- **Day 91:** Stripe Connect setup + webhook handler
- **Day 92:** Product/pricing catalog CRUD
- **Day 93:** Invoice generation (PDF via puppeteer)
- **Day 94:** Subscription management (create, cancel, upgrade)
- **Day 95:** Payment links (one-time and recurring)
- **Day 96:** Order management table
- **Day 97:** Coupon/discount codes
- **Day 98:** Revenue dashboard (Stripe data)
- **Day 99:** Refund processing UI
- **Day 100:** Billing test suite

---

## PHASE 11: White-label & Sub-accounts (Days 101–110)

- **Day 101:** Agency dashboard (overview of all sub-accounts)
- **Day 102:** Sub-account creation wizard
- **Day 103:** White-label branding (logo, colors, domain per agency)
- **Day 104:** Per-account custom domain with SSL (Caddy or Nginx config gen)
- **Day 105:** Agency-level permissions (what sub-account admins can access)
- **Day 106:** Snapshot system (copy workflow/funnel templates to new account)
- **Day 107:** Agency billing (resell to sub-accounts)
- **Day 108:** Agency usage dashboard (API calls, contacts, storage)
- **Day 109:** Sub-account impersonation (agency admin can "login as")
- **Day 110:** Multi-tenant integration test suite

---

## PHASE 12: Polish & Production (Days 111–120)

- **Day 111:** Mobile responsiveness audit & fixes
- **Day 112:** Performance: lazy loading, image optimization, DB query tuning
- **Day 113:** Security audit: input validation, rate limiting, OWASP checklist
- **Day 114:** Error tracking (Sentry integration)
- **Day 115:** Structured logging (Pino) + log aggregation
- **Day 116:** Load testing (k6) — target 500 concurrent users
- **Day 117:** Docker production build + Compose for deploy
- **Day 118:** Kubernetes manifests (optional: Helm chart)
- **Day 119:** Production deployment pipeline (GitHub Actions → ECR/DockerHub)
- **Day 120:** Launch readiness checklist + smoke tests

---

## Summary

| Phase | Days | Module |
|-------|------|--------|
| 1 | 1–10 | Foundation (monorepo, auth, multi-tenant, CI) |
| 2 | 11–20 | CRM Core (contacts, pipelines, kanban) |
| 3 | 21–30 | Messaging Hub (email, SMS, campaigns, chat) |
| 4 | 31–40 | Automation Workflows (visual builder, triggers) |
| 5 | 41–50 | Calendar & Booking |
| 6 | 51–65 | Funnels & Landing Pages |
| 7 | 66–70 | Reputation Management |
| 8 | 71–80 | Memberships & Courses |
| 9 | 81–90 | Reporting & Analytics |
| 10 | 91–100 | Billing & Payments |
| 11 | 101–110 | White-label & Sub-accounts |
| 12 | 111–120 | Polish & Production |

**Total: 120 days (~24 weeks, 6 months working at 1 feature/day)**
