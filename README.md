# Daddianza CRM — CFA Show Tracker & Exhibitor Management Platform

A full production-ready multi-tenant SaaS CRM built for CFA cat show exhibitors, inspired by EspoCRM. Catteries and cat clubs can subscribe, manage their cats, track show entries, record results, and give exhibitors a self-service portal.

---

## Features

### CRM (Admin)
- **Dashboard** — stats overview, upcoming shows, pipeline value, activity stream
- **Accounts** — catteries, clubs, judges, sponsors (linked to contacts & cats)
- **Contacts** — exhibitors with CFA member IDs, linked to accounts and cats
- **Cat Registry** — full cat profiles: breed, registration #, sex, titles, sire/dam lineage
- **CFA Show Tracker** — create shows, manage entries, record ring-by-ring results, award tracking
- **Leads** — kanban-style lead pipeline with source tracking and one-click conversion
- **Opportunities** — visual sales pipeline with stage-by-stage funnel view
- **Activities & Notes** — calls, meetings, emails, tasks linked to any record
- **Users** — role-based access (Super Admin, Admin, Manager, Agent, Viewer)
- **Client Portal Users** — create portal logins for exhibitors

### Exhibitor Portal (Self-Service)
- View own cat profiles and titles
- Browse upcoming shows open for entry
- Submit and withdraw show entries
- View results and award history
- Personal dashboard with stats

### SaaS / Billing
- Multi-tenant architecture (each cattery/club is isolated)
- Pay-monthly plans via Stripe: Starter ($29), Professional ($79), Enterprise ($199)
- Stripe Checkout + Customer Portal integration
- Usage limits enforced per plan (users, cats)
- 14-day free trial on registration

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (separate tokens for CRM and Portal) |
| Payments | Stripe Subscriptions |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Zustand + TanStack Query |
| Forms | React Hook Form |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL and JWT secrets
```

### 3. Database setup

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

**Default credentials:**
- Admin: `admin@daddianza.com` / `Admin@123456`
- Demo tenant: `owner@silvermist.com` / `Admin@123456`

---

## Docker (Production)

```bash
cp .env.example .env
# Fill in .env values

docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend node prisma/seed.js
```

---

## API Overview

All endpoints are under `/api/`. Auth via `Authorization: Bearer <token>` header.

| Module | Base Path |
|--------|-----------|
| Auth | `/api/auth` |
| Dashboard | `/api/dashboard` |
| Accounts | `/api/accounts` |
| Contacts | `/api/contacts` |
| Cats | `/api/cats` |
| Shows | `/api/shows` |
| Leads | `/api/leads` |
| Opportunities | `/api/opportunities` |
| Users | `/api/users` |
| Billing | `/api/billing` |
| Portal | `/api/portal` (portal JWT) |
| Activities | `/api/activities` |

---

## Subscription Plans

| Plan | Price | Users | Cats | Features |
|------|-------|-------|------|---------|
| Starter | $29/mo | 3 | 25 | Show Tracker, Cat Registry, Portal |
| Professional | $79/mo | 15 | 200 | + CRM Pipeline, Leads, Reports |
| Enterprise | $199/mo | Unlimited | Unlimited | + API, Custom Domain, White Label |

---

## Project Structure

```
Daddianza/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Full database schema
│   │   └── seed.js            # Demo data
│   └── src/
│       ├── config/            # Environment config
│       ├── controllers/       # Route handlers
│       ├── middleware/        # Auth, validation, tenant scope
│       ├── routes/            # Express routers
│       └── utils/             # Logger, API response helpers
├── frontend/
│   └── src/
│       ├── components/
│       │   └── common/        # Modal, Pagination, EmptyState, Layouts
│       ├── pages/
│       │   ├── admin/         # CRM pages (Dashboard, Shows, Cats, etc.)
│       │   ├── portal/        # Exhibitor portal pages
│       │   └── auth/          # Login, Register, Portal Login
│       ├── services/          # Axios API client
│       └── store/             # Zustand auth store
├── docker-compose.yml
└── README.md
```

---

## CFA Show Workflow

1. **Create Show** — Admin creates show with date, venue, judges, ring count, entry fee
2. **Open Entries** — Change status to `ENTRIES_OPEN`; exhibitors can submit via portal
3. **Manage Entries** — Assign cage numbers, confirm entries, track payment
4. **Close Entries** — Lock the entry list
5. **Record Results** — Enter ring-by-ring results, awards, points, finals placements
6. **Complete Show** — Mark show completed; results visible in exhibitor portal

---

## Security

- Bcrypt password hashing (12 rounds)
- JWT authentication with separate secrets for CRM and Portal
- Rate limiting (500 req/15min general, 20 req/15min for auth)
- Helmet.js security headers
- CORS whitelist
- Tenant-scoped data isolation (all queries filter by tenantId)
- Role-based access control (SUPER_ADMIN → ADMIN → MANAGER → AGENT → VIEWER)
